// CakeStoriesMobile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/** ===== Config ===== */
const API_URL = "https://adclubmadras.ayatiworks.com/api/save_lead.php";
const BROCHURE_URL = "/files/CS-BROCHURE-FINAL.pdf";
// Use full international format for WhatsApp. Change if needed.
const WA_NUMBER = "919962522374";

/** POST helper */
async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    // keepalive helps if user navigates away on mobile right after tapping
    keepalive: true,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Storage hook (resilient to JSON errors) */
function useLeadStore() {
  const [lead, setLead] = useState({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cake_lead");
      if (raw) setLead(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("cake_lead", JSON.stringify(lead));
    } catch {}
  }, [lead]);
  return { lead, setLead };
}

export default function CakeStoriesMobile() {
  return (
    <div
      className={[
        // svh is best for iOS/Android when the URL bar collapses;
        // dvh is a good fallback on modern browsers; we'll set both via utility classes.
        "min-h-[100svh] md:min-h-dvh bg-white text-slate-900 antialiased touch-manipulation",
      ].join(" ")}
      // Ensure the background fills under the notch on iOS
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <MobileFlow />
    </div>
  );
}

function MobileFlow() {
  const { lead, setLead } = useLeadStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const containerRef = useRef(null);

  // Restore step
  useEffect(() => {
    const s = localStorage.getItem("cake_step");
    if (s) setStep(Number(s));
  }, []);

  // On step change, persist & scroll top (helps on mobile after keyboard close)
  useEffect(() => {
    localStorage.setItem("cake_step", String(step));
    // smooth scroll to top for small screens
    containerRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const save = async (patch) => {
    setErr("");
    setLoading(true);
    try {
      const payload = { ...lead, ...patch };
      const resp = await postJSON(API_URL, payload);
      if (!resp?.ok) throw new Error(resp?.message || "Save failed");
      setLead({ ...payload, lead_id: resp.lead_id ?? lead.lead_id });
      return true;
    } catch (e) {
      setErr(e.message || "Save failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /** Supports:
   *  saveAndGo("role", value)  // key + value
   *  saveAndGo({ contact_time: value }, 6) // patch object + explicit next step
   */
  const saveAndGo = async (a, b) => {
    let patch, next = step + 1;
    if (typeof a === "string") patch = { [a]: b };
    else {
      patch = a || {};
      if (typeof b === "number") next = b;
    }
    const ok = await save(patch);
    if (ok) setStep(next);
  };

  const onContinueStep1 = async () => {
    if (!validName(lead.name) || !validPhone(lead.phone) || !validEmail(lead.email)) {
      setErr("Please fill all fields correctly.");
      return;
    }
    const ok = await save({});
    if (ok) setStep(2);
  };

  const downloadBrochure = () => {
    const a = document.createElement("a");
    a.href = BROCHURE_URL;
    a.download = "Cake-Stories-Franchise-Brochure.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const TOTAL_STEPS = 6;

  return (
    <div
      ref={containerRef}
      className="mx-auto w-full max-w-md"
      // Respect bottom safe-area for iOS; add extra padding so CTA isn’t hidden by home indicator
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px))" }}
    >
      <Header step={step} total={TOTAL_STEPS} />

      <main
        className="px-5 pb-24 pt-4"
        // Helps when the keyboard appears—mobile browsers avoid obscuring inputs
        style={{
          paddingBottom:
            "max(6rem, calc(6rem + env(safe-area-inset-bottom, 0px)))",
        }}
      >
        {/* Step 0: Landing */}
        {step === 0 && (
          <section className="flex flex-col items-center text-center">
            <div className="flex-1 w-full flex items-start justify-center">
              <div className="w-full max-w-[320px] py-10 text-center">
                <h1 className="font-bold tracking-tight font-primary leading-[1.05] text-3xl sm:text-4xl text-slate-900">
                  Own a
                  <br />
                  Premium Bakery
                  <br />
                  Franchise
                </h1>

                <p className="mt-6 text-base sm:text-lg font-medium font-primary leading-6 text-slate-600">
                  Be part of a fast-growing bakery brand
                  from The FreshlyMade, trusted for over 13 years.
                </p>

                <p className="mt-5 text-sm font-secondary leading-5 text-slate-400">
                  Get full support from setup and chef
                  <br />
                  training to operations and marketing success.
                </p>

                <img
                  src="/logo.png"
                  alt="Cake Stories"
                  className="mx-auto mt-8 h-12 opacity-90"
                  draggable="false"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="mt-6 w-full rounded-xl font-primary bg-[#007AFF] text-white font-semibold py-4 shadow-[0_6px_16px_rgba(0,122,255,0.25)] active:scale-[0.99] transition"
            >
              Continue
            </button>
          </section>
        )}

        {/* Step 1: Name/Phone/Email */}
        {step === 1 && (
          <section className="pt-2 pb-6">
            {/* local back row */}
            <div className="flex items-center justify-between -mt-2 mb-8">
              
              <img src="/logo.png" alt="Cake Stories" className="h-15" />
              <span className="w-[18px]" />
            </div>

            <FieldBlock
              label="Name"
              hint="We’d love to know who we’re speaking with."
              value={lead.name || ""}
              onChange={(v) => setLead((s) => ({ ...s, name: v }))}
              placeholder="What’s your full name?"
              // Mobile-friendly input UX
              inputProps={{
                autoCorrect: "off",
                autoCapitalize: "words",
                autoComplete: "name",
                enterKeyHint: "next",
              }}
              valid={validName(lead.name)}
            />

            <FieldBlock
              label="Phone Number"
              hint="Our franchise team will call or WhatsApp you within 24 hours."
              value={lead.phone || ""}
              onChange={(v) => setLead((s) => ({ ...s, phone: v }))}
              placeholder="Your mobile number (9876543211)"
              type="tel"
              inputProps={{
                inputMode: "tel",
                autoComplete: "tel",
                enterKeyHint: "next",
                pattern: "[0-9+ ]*",
              }}
              valid={validPhone(lead.phone)}
            />

            <FieldBlock
              label="Email"
              hint="We’ll send your Cake Stories franchise brochure and setup details."
              value={lead.email || ""}
              onChange={(v) => setLead((s) => ({ ...s, email: v }))}
              placeholder="name@example.com"
              type="email"
              inputProps={{
                inputMode: "email",
                autoComplete: "email",
                enterKeyHint: "done",
                // Prevent iOS zoom (we keep font-size >= 16px too)
              }}
              valid={validEmail(lead.email)}
            />

            <button
              onClick={onContinueStep1}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-[#007AFF] text-white font-primary font-semibold py-4
                 shadow-[0_8px_20px_rgba(0,122,255,0.28)] disabled:opacity-50 active:scale-[0.99] transition"
            >
              {loading ? "Saving…" : "Continue"}
            </button>

            {err && <p className="text-sm text-red-600 font-secondary mt-2">{err}</p>}
          </section>
        )}

        {/* Step 2: Role (auto-advance on tap) */}
        {step === 2 && (
          <section>
            <img src="/logo.png" alt="" className="h-12 mb-8" />

            <h2 className="text-3xl sm:text-4xl font-primary font-bold mb-2">Mr. {firstName(lead.name)},</h2>
            <p className="text-lg sm:text-xl font-secondary text-black/60 mt-3 mb-8">
              which best describes you?
            </p>

            <OptionAutoAdvanceList
              onPick={(val) => saveAndGo("role", val)}
              options={[
                { label: "I’m a Business Owner", value: "Business Owner" },
                { label: "I’m an Investor", value: "Investor" },
                { label: "I’m Exploring new franchise opportunities", value: "Exploring" },
              ]}
            />

            <div className="flex items-center justify-between mt-8">
              <button
                className="text-base sm:text-lg rounded-lg font-primary border border-[#007AFF] px-5 py-3 text-[#007AFF]"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                className="rounded-lg bg-[#007AFF] text-white text-base sm:text-lg font-semibold px-5 py-3 opacity-60 cursor-default"
                disabled
              >
                Continue
              </button>
            </div>

            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </section>
        )}

        {/* Step 3/4/5 branches */}
        {step === 3 && lead.role === "Business Owner" && (
          <section className="mt-6">
            <h2 className="text-3xl sm:text-4xl font-primary font-semibold mb-2">Mr. {firstName(lead.name)},</h2>
            <p className="text-base sm:text-lg font-secondary text-slate-500 -mt-1">tell us a bit about your business</p>

            <p className="text-lg sm:text-xl font-secondary text-black/60 mt-5 mb-8">
              What kind of business do you currently operate?
            </p>

            <AutoIconSelect
              onPick={(v) => saveAndGo("business_type", v)}
              options={[
                { img: "/icon-1.png", label: "Café or Restaurant", value: "Café or Restaurant" },
                { img: "/icon-2.png", label: "Bakery or Cloud Kitchen", value: "Bakery or Cloud Kitchen" },
                { img: "/icon-3.png", label: "Retail or FMCG Outlet", value: "Retail or FMCG Outlet" },
                { img: "/icon-4.png", label: "Other", value: "Other" },
              ]}
            />

            <NavLock />
            <BackStub onBack={() => setStep(2)} />
          </section>
        )}

        {step === 4 && lead.role === "Business Owner" && (
          <section>
            <img src="/logo.png" alt="" className="h-12 mb-8" />
            <h2 className="text-3xl sm:text-4xl font-primary font-bold mb-2">Mr. {firstName(lead.name)},</h2>

            <p className="text-lg sm:text-xl font-secondary text-black/60 mt-5 mb-8">
              What’s your available investment range for expansion?
            </p>

            <OptionAutoAdvanceList
              onPick={(v) => saveAndGo("investment_range", v)}
              options={[
                { label: "₹18 L – ₹25 L", value: "₹18 L – ₹25 L" },
                { label: "₹26 L – ₹35 L", value: "₹26 L – ₹35 L" },
                { label: "Above ₹35 L", value: "Above ₹35 L" },
              ]}
            />

            <NavLock />
            <BackStub onBack={() => setStep(3)} />
          </section>
        )}

        {step === 5 && lead.role === "Business Owner" && (
          <section>
            <img src="/logo.png" alt="" className="h-12 mb-8" />
            <h2 className="text-3xl sm:text-4xl font-primary font-bold mb-2">Mr. {firstName(lead.name)},</h2>

            <p className="text-lg sm:text-xl font-secondary text-black/60 mt-5 mb-8">
              When is the best time for our team to reach you?
            </p>

            <OptionAutoAdvanceList
              options={[
                { label: "Morning (10 AM – 12 PM)", value: "Morning (10 AM – 12 PM)" },
                { label: "Afternoon (12 PM – 4 PM)", value: "Afternoon (12 PM – 4 PM)" },
                { label: "Evening (4 PM – 7 PM)", value: "Evening (4 PM – 7 PM)" },
              ]}
              onPick={(v) => saveAndGo({ contact_time: v }, 6)}
            />

            <NavLock />
            <BackStub onBack={() => setStep(4)} />
          </section>
        )}

        {/* ===== Investor ===== */}
        {step === 3 && lead.role === "Investor" && (
          <section>
            <img src="/logo.png" alt="" className="h-12 mb-8" />
            <h2 className="text-3xl sm:text-4xl font-primary font-bold mb-2">Mr. {firstName(lead.name)},</h2>

            <p className="text-lg sm:text-xl font-secondary text-black/60 mt-5 mb-8">
              What type of franchise are you most interested in?
            </p>

            <OptionAutoAdvanceList
              options={[
                { label: "Food & Beverage Franchise", value: "Food & Beverage Franchise" },
                { label: "Café or Dessert Concept", value: "Café or Dessert Concept" },
                { label: "Premium Bakery Brand", value: "Premium Bakery Brand" },
                { label: "Open to explore options", value: "Open to explore options" },
              ]}
              onPick={(v) => saveAndGo("investor_interest", v)}
            />

            <NavLock />
            <BackStub onBack={() => setStep(2)} />
          </section>
        )}

        {step === 4 && lead.role === "Investor" && (
          <section>
            <img src="/logo.png" alt="" className="h-12 mb-8" />
            <h2 className="text-3xl sm:text-4xl font-primary font-bold mb-2">Mr. {firstName(lead.name)},</h2>

            <p className="text-lg sm:text-xl font-secondary text-black/60 mt-5 mb-8">
              What’s your investment budget?
            </p>

            <OptionAutoAdvanceList
              options={[
                { label: "₹18 L – ₹25 L", value: "₹18 L – ₹25 L" },
                { label: "₹26 L – ₹35 L", value: "₹26 L – ₹35 L" },
                { label: "Above ₹35 L", value: "Above ₹35 L" },
              ]}
              onPick={(v) => saveAndGo("investor_budget", v)}
            />

            <NavLock />
            <BackStub onBack={() => setStep(3)} />
          </section>
        )}

        {step === 5 && lead.role === "Investor" && (
          <section>
            <img src="/logo.png" alt="" className="h-12 mb-8" />
            <h2 className="text-3xl sm:text-4xl font-primary font-bold mb-2">Mr. {firstName(lead.name)},</h2>

            <p className="text-lg sm:text-xl font-secondary text-black/60 mt-5 mb-8">
              When is a good time for us to contact you?
            </p>

            <OptionAutoAdvanceList
              options={[
                { label: "Morning (10 AM – 12 PM)", value: "Morning (10 AM – 12 PM)" },
                { label: "Afternoon (12 PM – 4 PM)", value: "Afternoon (12 PM – 4 PM)" },
                { label: "Evening (4 PM – 7 PM)", value: "Evening (4 PM – 7 PM)" },
              ]}
              onPick={(v) => saveAndGo({ investor_contact_time: v }, 6)}
            />

            <NavLock />
            <BackStub onBack={() => setStep(4)} />
          </section>
        )}

        {/* ===== Exploring ===== */}
        {step === 3 && lead.role === "Exploring" && (
          <section>
            <img src="/logo.png" alt="" className="h-12 mb-8" />
            <h2 className="text-3xl sm:text-4xl font-primary font-bold mb-2">Mr. {firstName(lead.name)},</h2>

            <p className="text-lg sm:text-xl font-secondary text-black/60 mt-5 mb-8">
              What kind of business are you most excited to start?
            </p>

            <OptionAutoAdvanceList
              options={[
                { label: "Food & Beverage or Café Concept", value: "Food & Beverage or Café Concept" },
                { label: "Bakery or Dessert Brand", value: "Bakery or Dessert Brand" },
                { label: "Quick-Service Restaurant (QSR)", value: "Quick-Service Restaurant (QSR)" },
                { label: "Still deciding", value: "Still deciding" },
              ]}
              onPick={(v) => saveAndGo("exploring_kind", v)}
            />

            <NavLock />
            <BackStub onBack={() => setStep(2)} />
          </section>
        )}

        {step === 4 && lead.role === "Exploring" && (
          <section>
            <img src="/logo.png" alt="" className="h-12 mb-8" />
            <h2 className="text-3xl sm:text-4xl font-primary font-bold mb-2">Mr. {firstName(lead.name)},</h2>

            <p className="text-lg sm:text-xl font-secondary text-black/60 mt-5 mb-8">
              What’s your estimated investment capacity?
            </p>

            <OptionAutoAdvanceList
              options={[
                { label: "₹18 L – ₹25 L", value: "₹18 L – ₹25 L" },
                { label: "₹26 L – ₹35 L", value: "₹26 L – ₹35 L" },
                { label: "Above ₹35 L", value: "Above ₹35 L" },
              ]}
              onPick={(v) => saveAndGo("exploring_budget", v)}
            />

            <NavLock />
            <BackStub onBack={() => setStep(3)} />
          </section>
        )}

        {step === 5 && lead.role === "Exploring" && (
          <section>
            <img src="/logo.png" alt="" className="h-12 mb-8" />
            <h2 className="text-3xl sm:text-4xl font-primary font-bold mb-2">Mr. {firstName(lead.name)},</h2>

            <p className="text-lg sm:text-xl font-secondary text-black/60 mt-5 mb-8">
              When are you planning to start your business?
            </p>

            <OptionAutoAdvanceList
              options={[
                { label: "Within 1 month", value: "Within 1 month" },
                { label: "1–3 months", value: "1–3 months" },
                { label: "3–6 months", value: "3–6 months" },
                { label: "Not sure yet", value: "Not sure yet" },
              ]}
              onPick={(v) => saveAndGo({ exploring_timeline: v }, 6)}
            />

            <NavLock />
            <BackStub onBack={() => setStep(4)} />
          </section>
        )}

        {/* Step 6: Thank-you */}
        {step === 6 && (
          <section className="text-center pt-16 pb-8">
            <div className="mx-auto h-28 w-28 rounded-full grid place-items-center">
              <img src="/smily.png" alt="" className="h-28 w-28" />
            </div>

            <h2 className="mt-10 text-3xl sm:text-4xl leading-tight font-primary font-bold text-black/90 text-center">
              Thank you <span className="text-black">{firstName(lead.name)}</span>
              <br />
              <span>for your interest</span>
              <br />
              <span>in Cake Stories</span>
            </h2>

            <p className="mt-6 text-base sm:text-lg font-secondary leading-6 text-slate-600">
              Our franchise team will connect with you soon to
              discuss your preferred city and model options.
            </p>
            <p className="mt-4 text-sm sm:text-base font-secondary text-slate-400">
              Get ready to start your sweet success story!
            </p>

            <button
              onClick={downloadBrochure}
              className="mt-6 inline-flex flex-col border border-blue-300 hover:shadow rounded-xl py-3 px-5 cursor-pointer items-center justify-center active:scale-[0.99] transition"
              aria-label="Download Brochure"
            >
              <span className="text-xl font-semibold text-black/90">
                Download Brochure
              </span>
              <img src="/down.png" alt="" className="mt-2 h-6 w-6" />
            </button>

            <button
              onClick={() => {
                const msg = `Hi, I'm ${firstName(
                  lead.name
                )}. I just submitted the Cake Stories franchise form. Please share the brochure and next steps.`;
                const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
                  msg
                )}`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="mt-6 w-full rounded-xl bg-[#007AFF] cursor-pointer text-white font-semibold py-4 shadow-[0_8px_20px_rgba(0,122,255,0.28)] active:scale-[0.99] font-primary transition"
            >
              WhatsApp
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

/* ================= Header ================= */
function Header({ step, total }) {
  const showSteps = step > 0 && step <= total;
  const current = Math.min(Math.max(step, 1), total);
  const pct = Math.round((current / total) * 100);

  return (
    <header
      className="sticky top-0 z-10 bg-white"
      style={{
        // Safe-area top padding for iOS notch
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="mx-auto max-w-md px-5 pt-2">
        <div className="flex items-center justify-between">
          <div className="min-w-[72px] text-[13px] font-semibold text-slate-700">
            {showSteps ? `Step ${current}` : ""}
          </div>
          <div className="min-w-[72px] text-right text-[13px] font-semibold text-indigo-600">
            {showSteps ? `${current} / ${total}` : ""}
          </div>
        </div>

        {showSteps && (
          <div className="mt-3 mb-2">
            <div className="h-[2px] w-full rounded bg-slate-200">
              <div
                className="h-[2px] rounded bg-[#5B61F6] transition-all will-change-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/* ============ Tiny helpers ============ */
function NavLock() {
  return (
    <div className="flex items-center justify-between mt-8 opacity-80">
      <button className="text-base rounded-lg font-primary border border-[#007AFF] px-5 py-3 text-[#007AFF]" disabled>
        Back
      </button>
      <button className="rounded-lg bg-[#007AFF] text-white text-base font-semibold px-5 py-3 opacity-60 cursor-default" disabled>
        Continue
      </button>
    </div>
  );
}

function BackStub({ onBack }) {
  return (
    <div className="mt-2">
      <button
        className="block w-full text-center text-sm text-slate-500 underline underline-offset-4"
        onClick={onBack}
      >
        Back
      </button>
    </div>
  );
}

/* ============ UI bits ============ */
function AutoIconSelect({ options, onPick }) {
  return (
    <ul className="space-y-6 mt-2">
      {options.map((opt) => (
        <li key={opt.value}>
          <button
            onClick={() => onPick(opt.value)}
            className="w-full rounded-xl font-secondary px-4 py-4 text-left border transition bg-white
                       flex items-center gap-4 border-slate-200 hover:bg-slate-50 active:scale-[0.98]"
          >
            <img src={opt.img} alt="" className="h-10 w-10 object-contain" />
            <span className="text-lg sm:text-2xl font-semibold text-slate-800">{opt.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function OptionAutoAdvanceList({ options, onPick }) {
  return (
    <ul className="space-y-6">
      {options.map((opt) => (
        <li key={opt.value}>
          <button
            onClick={() => onPick(opt.value)}
            className={[
              "w-full rounded-xl border font-secondary border-slate-200 bg-white",
              "px-4 py-4 sm:py-5 text-lg sm:text-2xl font-semibold text-slate-900",
              "shadow-sm hover:bg-slate-50 active:scale-[0.995] transition",
            ].join(" ")}
          >
            {opt.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

function FieldBlock({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  valid = true,
  inputProps = {},
}) {
  return (
    <div className="mb-5 mt-5">
      <div className="text-lg sm:text-xl font-primary font-bold text-left text-slate-900 mb-2">
        {label}
      </div>

      <input
  type={type}
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
  className={[
    "w-full rounded-lg border px-4 py-[1.05rem] font-secondary font-medium text-[17px] leading-[1.4]",
    "bg-white placeholder:text-slate-400 appearance-none",
    "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]",
    "focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40",
    valid
      ? "border-slate-200"
      : "border-slate-300 focus:slate-red-300",
  ].join(" ")}
  style={{
    // ✅ Prevent Android text clipping
    WebkitAppearance: "none",
    lineHeight: "1.4",
    height: "auto",
    paddingTop: "14px",
    paddingBottom: "14px",
  }}
  {...inputProps}
/>


      <p className="mt-2 text-sm sm:text-base text-left leading-6 font-secondary text-black/40">
        {hint}
      </p>
    </div>
  );
}

/* ============ Validators ============ */
const firstName = (s) => (s ? String(s).trim().split(" ")[0] : "");
const validName = (s) => !!s && String(s).trim().length >= 3;
// Accepts +country format or 10–15 digits; keeps your broad validation while
// being friendly to Android/iOS numeric keypads.
const validPhone = (s) => !!s && /^\+?[0-9 ]{10,15}$/.test(String(s));
const validEmail = (s) =>
  !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s));
