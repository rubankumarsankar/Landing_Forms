// CakeStoriesForm.jsx
import React, { useEffect, useMemo, useState } from "react";

/** ===== Config ===== */
const API_URL = "https://adclubmadras.ayatiworks.com/api/save_lead.php";
// Put your brochure pdf here (absolute or public path)
const BROCHURE_URL = "/files/CS-BROCHURE-FINAL.pdf";

/** Simple JSON POST helper */
async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function CakeStoriesForm() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <MobileLanding />
    </div>
  );
}

/* =========================
   Local store for lead data
   ========================= */
function useLeadStore() {
  const [lead, setLead] = useState({});
  useEffect(() => {
    const raw = localStorage.getItem("cake_lead");
    if (raw) setLead(JSON.parse(raw));
  }, []);
  useEffect(() => {
    localStorage.setItem("cake_lead", JSON.stringify(lead));
  }, [lead]);
  return { lead, setLead };
}

/* =========================
   Page shell and step flow
   ========================= */
function MobileLanding() {
  const { lead, setLead } = useLeadStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // restore last step
  useEffect(() => {
    const s = localStorage.getItem("cake_step");
    if (s) setStep(Number(s));
  }, []);
  useEffect(() => {
    localStorage.setItem("cake_step", String(step));
  }, [step]);

  // save patch to backend, keep/update lead_id, move to next step
  const saveAndNext = async (patch, nextStep) => {
    setLoading(true);
    setError("");
    try {
      const payload = { ...lead, ...patch };
      const resp = await postJSON(API_URL, payload);
      if (!resp?.ok) throw new Error(resp?.error || "Save failed");
      const merged = { ...payload, lead_id: resp.lead_id ?? lead.lead_id };
      setLead(merged);
      if (typeof nextStep === "number") setStep(nextStep);
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  // helper: download file (forces “save as” intent)
  const triggerDownload = (url, filename = "Cake-Stories-Franchise-Brochure.pdf") => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // browsers honor this for same-origin or permitted files
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // save email, download brochure, then go to step 8
  const handleSaveEmailAndDownload = async () => {
    try {
      await saveAndNext({}, null); // just save; do not advance yet
      triggerDownload(BROCHURE_URL);
      setStep(8);
    } catch {
      // saveAndNext already sets error
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <TopBar step={step} total={10} brand="Cake Stories" />
      <Progress step={step} total={10} />

      <main className="px-4 pb-24 pt-6">
        {/* Step 1: Name */}
        {step === 1 && (
          <Card title="What’s your full name?">
            <LabeledInput
              label="Full name"
              value={lead.name || ""}
              onChange={(v) => setLead((s) => ({ ...s, name: v }))}
              placeholder="Your name"
            />
            <PrimaryButton
              disabled={loading || !validName(lead.name)}
              onClick={() => saveAndNext({}, 2)}
            >
              {loading ? "Saving…" : "Next"}
            </PrimaryButton>
            {error && <ErrorText msg={error} />}
          </Card>
        )}

        {/* Step 2: Phone */}
        {step === 2 && (
          <Card title="Could you share your mobile number?">
            <p className="text-xs text-slate-500">
              Our franchise team will call or WhatsApp you within 24 hours.
            </p>
            <LabeledInput
              type="tel"
              label="Mobile number"
              value={lead.phone || ""}
              onChange={(v) => setLead((s) => ({ ...s, phone: v }))}
              placeholder="10 to 15 digits"
              pattern="^\\+?[0-9]{10,15}$"
            />
            <PrimaryButton
              disabled={loading || !validPhone(lead.phone)}
              onClick={() => saveAndNext({}, 3)}
            >
              {loading ? "Saving…" : "Next"}
            </PrimaryButton>
            <Back onClick={() => setStep(1)} />
            {error && <ErrorText msg={error} />}
          </Card>
        )}

        {/* Step 3: Role */}
        {step === 3 && (
          <Card
            title={`Hi ${firstName(lead.name)}, which best describes you?`}
          >
            <OptionList
              options={[
                { emoji: "🧑‍💼", label: "I’m a Business Owner", value: "Business Owner" },
                { emoji: "💰", label: "I’m an Investor", value: "Investor" },
                { emoji: "👀", label: "I’m Exploring new franchise opportunities", value: "Exploring" },
              ]}
              loading={loading}
              onPick={(val) => saveAndNext({ role: val }, 4)}
            />
            <Back onClick={() => setStep(2)} />
            {error && <ErrorText msg={error} />}
          </Card>
        )}

        {/* Role branches share steps 4..6, then step 7 email, 8 thank you */}
        {lead.role === "Business Owner" && (
          <OwnerFlow step={step} setStep={setStep} saveAndNext={saveAndNext} error={error} loading={loading} />
        )}
        {lead.role === "Investor" && (
          <InvestorFlow step={step} setStep={setStep} saveAndNext={saveAndNext} error={error} loading={loading} />
        )}
        {lead.role === "Exploring" && (
          <ExploringFlow step={step} setStep={setStep} saveAndNext={saveAndNext} error={error} loading={loading} />
        )}

        {/* Step 7: Email (with Save & Download Brochure) */}
        {step === 7 && (
          <Card title="Please share your email address">
            <p className="text-xs text-slate-500">
              We’ll send your Cake Stories franchise brochure and setup details.
            </p>
            <LabeledInput
              type="email"
              label="Email"
              value={lead.email || ""}
              onChange={(v) => setLead((s) => ({ ...s, email: v }))}
              placeholder="you@example.com"
              pattern="^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PrimaryButton
                disabled={loading || !validEmail(lead.email)}
                onClick={() => saveAndNext({}, 8)}
              >
                {loading ? "Saving…" : "Finish"}
              </PrimaryButton>

              {/* Save & Download brochure, then go to thank-you */}
              <button
                disabled={loading || !validEmail(lead.email)}
                onClick={handleSaveEmailAndDownload}
                className="w-full rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save & Download Brochure"}
              </button>
            </div>

            <Back onClick={() => setStep(6)} />
            {error && <ErrorText msg={error} />}
          </Card>
        )}

        {/* Step 8: Thank you — WhatsApp advances & Go Home */}
        {step === 8 && (
          <ThankYou
            name={lead.name}
            onNext={() => saveAndNext({ completed: true }, 9)}
          />
        )}

        {/* Step 9: Final confirmation */}
        {step === 9 && (
          <Card title="All set!">
            <p className="text-sm text-slate-700">
              Thanks for reaching out on WhatsApp. Our team will get back to you shortly.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a
                href="https://wa.me/9962522374"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border px-4 py-3 text-sm font-semibold text-center"
              >
                Chat Again
              </a>
              <PrimaryButton onClick={() => setStep(1)}>Start Over</PrimaryButton>
            </div>
          </Card>
        )}
      </main>

      {/* Bottom WhatsApp + Call (persistent) */}
      {/* <footer className="fixed inset-x-0 bottom-0 bg-white/95 border-t">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <a
            href="https://wa.me/9962522374"
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center rounded-xl border text-sm font-semibold py-3"
          >
            Message Us on WhatsApp
          </a>
          <a
            href="tel:+919962522374"
            className="rounded-xl border px-4 py-3 text-sm font-semibold"
          >
            Call
          </a>
        </div>
      </footer> */}
    </div>
  );
}

/* ================
   Branch flows
   ================ */

function OwnerFlow({ step, setStep, saveAndNext, error, loading }) {
  if (step === 4)
    return (
      <Card title="Tell us a bit about your business">
        <OptionList
          loading={loading}
          onPick={(v) => saveAndNext({ business_type: v }, 5)}
          options={[
            { emoji: "☕", label: "Café or Restaurant", value: "Café or Restaurant" },
            { emoji: "🧁", label: "Bakery or Cloud Kitchen", value: "Bakery or Cloud Kitchen" },
            { emoji: "🏪", label: "Retail or FMCG Outlet", value: "Retail or FMCG Outlet" },
            { emoji: "🎯", label: "Other", value: "Other" },
          ]}
        />
        <Back onClick={() => setStep(3)} />
        {error && <ErrorText msg={error} />}
      </Card>
    );

  if (step === 5)
    return (
      <Card title="What’s your available investment range for expansion?">
        <OptionList
          loading={loading}
          onPick={(v) => saveAndNext({ investment_range: v }, 6)}
          options={[
            { emoji: "💸", label: "₹18 L – ₹25 L", value: "₹18 L – ₹25 L" },
            { emoji: "💰", label: "₹26 L – ₹35 L", value: "₹26 L – ₹35 L" },
            { emoji: "🏦", label: "Above ₹35 L", value: "Above ₹35 L" },
          ]}
        />
        <Back onClick={() => setStep(4)} />
        {error && <ErrorText msg={error} />}
      </Card>
    );

  if (step === 6)
    return (
      <Card title="When is the best time for our team to reach you?">
        <OptionList
          loading={loading}
          onPick={(v) => saveAndNext({ contact_time: v }, 7)}
          options={[
            { emoji: "🌅", label: "Morning (10 AM – 12 PM)", value: "Morning (10 AM – 12 PM)" },
            { emoji: "🌤", label: "Afternoon (12 PM – 4 PM)", value: "Afternoon (12 PM – 4 PM)" },
            { emoji: "🌆", label: "Evening (4 PM – 7 PM)", value: "Evening (4 PM – 7 PM)" },
          ]}
        />
        <Back onClick={() => setStep(5)} />
        {error && <ErrorText msg={error} />}
      </Card>
    );

  return null;
}

function InvestorFlow({ step, setStep, saveAndNext, error, loading }) {
  if (step === 4)
    return (
      <Card title="Let’s understand your investment goals">
        <OptionList
          loading={loading}
          onPick={(v) => saveAndNext({ investor_interest: v }, 5)}
          options={[
            { emoji: "🍽", label: "Food & Beverage Franchise", value: "Food & Beverage Franchise" },
            { emoji: "☕", label: "Café or Dessert Concept", value: "Café or Dessert Concept" },
            { emoji: "🎂", label: "Premium Bakery Brand", value: "Premium Bakery Brand" },
            { emoji: "🎲", label: "Open to explore options", value: "Open to explore options" },
          ]}
        />
        <Back onClick={() => setStep(3)} />
        {error && <ErrorText msg={error} />}
      </Card>
    );

  if (step === 5)
    return (
      <Card title="What’s your investment budget?">
        <OptionList
          loading={loading}
          onPick={(v) => saveAndNext({ investor_budget: v }, 6)}
          options={[
            { emoji: "💸", label: "₹18 L – ₹25 L", value: "₹18 L – ₹25 L" },
            { emoji: "💰", label: "₹26 L – ₹35 L", value: "₹26 L – ₹35 L" },
            { emoji: "🏦", label: "Above ₹35 L", value: "Above ₹35 L" },
          ]}
        />
        <Back onClick={() => setStep(4)} />
        {error && <ErrorText msg={error} />}
      </Card>
    );

  if (step === 6)
    return (
      <Card title="When is a good time for us to contact you?">
        <OptionList
          loading={loading}
          onPick={(v) => saveAndNext({ investor_contact_time: v }, 7)}
          options={[
            { emoji: "🌅", label: "Morning (10 AM – 12 PM)", value: "Morning (10 AM – 12 PM)" },
            { emoji: "🌤", label: "Afternoon (12 PM – 4 PM)", value: "Afternoon (12 PM – 4 PM)" },
            { emoji: "🌆", label: "Evening (4 PM – 7 PM)", value: "Evening (4 PM – 7 PM)" },
          ]}
        />
        <Back onClick={() => setStep(5)} />
        {error && <ErrorText msg={error} />}
      </Card>
    );

  return null;
}

function ExploringFlow({ step, setStep, saveAndNext, error, loading }) {
  if (step === 4)
    return (
      <Card title="Let’s help you find your ideal business opportunity">
        <OptionList
          loading={loading}
          onPick={(v) => saveAndNext({ exploring_kind: v }, 5)}
          options={[
            { emoji: "☕", label: "Food & Beverage or Café Concept", value: "Food & Beverage or Café Concept" },
            { emoji: "🍰", label: "Bakery or Dessert Brand", value: "Bakery or Dessert Brand" },
            { emoji: "🍔", label: "Quick-Service Restaurant (QSR)", value: "Quick-Service Restaurant (QSR)" },
            { emoji: "🤔", label: "Still deciding", value: "Still deciding" },
          ]}
        />
        <Back onClick={() => setStep(3)} />
        {error && <ErrorText msg={error} />}
      </Card>
    );

  if (step === 5)
    return (
      <Card title="What’s your estimated investment capacity?">
        <OptionList
          loading={loading}
          onPick={(v) => saveAndNext({ exploring_budget: v }, 6)}
          options={[
            { emoji: "💸", label: "₹18 L – ₹25 L", value: "₹18 L – ₹25 L" },
            { emoji: "💰", label: "₹26 L – ₹35 L", value: "₹26 L – ₹35 L" },
            { emoji: "🏦", label: "Above ₹35 L", value: "Above ₹35 L" },
          ]}
        />
        <Back onClick={() => setStep(4)} />
        {error && <ErrorText msg={error} />}
      </Card>
    );

  if (step === 6)
    return (
      <Card title="When are you planning to start your business?">
        <OptionList
          loading={loading}
          onPick={(v) => saveAndNext({ exploring_timeline: v }, 7)}
          options={[
            { emoji: "⚡", label: "Within 1 month", value: "Within 1 month" },
            { emoji: "⏳", label: "1–3 months", value: "1–3 months" },
            { emoji: "📆", label: "3–6 months", value: "3–6 months" },
            { emoji: "🤷‍♂️", label: "Not sure yet", value: "Not sure yet" },
          ]}
        />
        <Back onClick={() => setStep(5)} />
        {error && <ErrorText msg={error} />}
      </Card>
    );

  return null;
}

/* ================
   UI bits
   ================ */

function TopBar({ step, total, brand }) {
  return (
    <header className="sticky top-0 z-10 bg-white">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => history.back()}
            aria-label="Back"
            className="h-9 w-9 rounded-full hover:bg-slate-100 grid place-items-center"
          >
            ←
          </button>

          <div className="text-xl font-semibold tracking-wide text-indigo-600">
            {brand}
          </div>

          <div className="text-sm font-semibold text-indigo-600">
            {step} / {total}
          </div>
        </div>
      </div>
    </header>
  );
}

function Progress({ step, total }) {
  const pct = useMemo(() => Math.round((step / total) * 100), [step, total]);
  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="h-1 w-full rounded bg-slate-100">
        <div className="h-1 rounded bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="mt-6 rounded-2xl border p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function LabeledInput({ label, value, onChange, placeholder, type = "text", pattern }) {
  const [touched, setTouched] = useState(false);
  const valid = pattern ? new RegExp(pattern).test(value || "") : (value || "").trim().length > 0;
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        className={[
          "mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2",
          !touched || valid ? "border-slate-300 focus:ring-slate-900" : "border-red-400 focus:ring-red-500",
        ].join(" ")}
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
      />
      {!valid && touched && <p className="mt-1 text-xs text-red-600">Please enter a valid value.</p>}
    </div>
  );
}

function OptionList({ options, onPick, loading }) {
  const [active, setActive] = useState(null);
  return (
    <ul className="space-y-4">
      {options.map((opt) => {
        const on = active === opt.value;
        return (
          <li key={opt.value}>
            <button
              disabled={loading}
              onClick={() => {
                setActive(opt.value);
                onPick(opt.value);
              }}
              className={[
                "w-full rounded-2xl px-5 py-5 text-left",
                "flex items-center gap-4",
                "bg-slate-50 hover:bg-slate-100",
                "border border-slate-200",
                "transition",
                on ? "ring-2 ring-indigo-600" : "",
              ].join(" ")}
            >
              <span className="text-3xl leading-none">{opt.emoji}</span>
              <span className="text-base font-semibold text-slate-800">{opt.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Back({ onClick }) {
  return (
    <button onClick={onClick} className="text-sm underline text-slate-600 mt-2">
      Back
    </button>
  );
}

function ErrorText({ msg }) {
  return <p className="text-xs text-red-600">{msg}</p>;
}

/* Thank-you step with WhatsApp + Go Home */
function ThankYou({ name, onNext }) {
  const first = firstName(name);
  const waText = `Hi, I'm ${first}. I just submitted the Cake Stories franchise form. Please share the brochure and next steps.`;
  const waUrl = `https://wa.me/9962522374?text=${encodeURIComponent(waText)}`;

  const handleWhatsApp = () => {
    window.open(waUrl, "_blank", "noopener,noreferrer");
    if (typeof onNext === "function") onNext();
  };

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Thank you {first} for your interest in Cake Stories</h2>
      <p className="mt-2 text-sm text-slate-700">
        Our franchise team will connect with you soon to discuss your preferred city and model options.
        Get ready to start your sweet success story!
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleWhatsApp}
          className="rounded-xl border px-4 py-3 text-sm font-semibold"
        >
          Message Us on WhatsApp
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="rounded-xl border px-4 py-3 text-sm font-semibold"
        >
          Go to Home
        </button>
      </div>
    </section>
  );
}

/* ================
   Validators
   ================ */
const firstName = (s) => (s ? String(s).trim().split(" ")[0] : "there");
const validName = (s) => !!s && String(s).trim().length >= 3;
const validPhone = (s) => !!s && /^\+?[0-9]{10,15}$/.test(String(s));
const validEmail = (s) => !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s));
