// CakeStoriesMobile.jsx
import React, { useEffect, useMemo, useState } from "react";

/** ===== Config ===== */
const API_URL = "https://adclubmadras.ayatiworks.com/api/save_lead.php";
const BROCHURE_URL = "/files/CS-BROCHURE-FINAL.pdf";
const WA_NUMBER = "9962522374";

/** POST helper */
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

/** Storage hook */
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

export default function CakeStoriesMobile() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <MobileFlow />
    </div>
  );
}

function MobileFlow() {
  const { lead, setLead } = useLeadStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [picked, setPicked] = useState(null); // for option screens

  useEffect(() => {
    const s = localStorage.getItem("cake_step");
    if (s) setStep(Number(s));
  }, []);
  useEffect(() => {
    localStorage.setItem("cake_step", String(step));
    setPicked(null);
  }, [step]);

  const save = async (patch) => {
    setErr("");
    setLoading(true);
    try {
      const payload = { ...lead, ...patch };
      const resp = await postJSON(API_URL, payload);
      if (!resp?.ok) throw new Error(resp?.message || "Save failed");
      setLead({ ...payload, lead_id: resp.lead_id ?? lead.lead_id }); // CS0001 style id
      return true;
    } catch (e) {
      setErr(e.message || "Save failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /** Supports both:
   *  saveAndGo("role", value)  // key + value
   *  saveAndGo({ contact_time: value }, 6) // patch object + explicit next step
   */
  const saveAndGo = async (a, b) => {
    let patch, next = step + 1;
    if (typeof a === "string") {
      patch = { [a]: b };
    } else {
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

  // Progress total: 1..6 (Thank-you is step 6). Keeping your design, just correct numbers.
  const TOTAL_STEPS = 6;

  return (
    <div className="mx-auto w-full max-w-md">
      <Header step={step} total={TOTAL_STEPS} onBack={() => setStep(Math.max(0, step - 1))} />

      <main className="px-5 pb-24 pt-4">
        {/* Step 0: Landing */}
        {step === 0 && (
          <section className="flex flex-col items-center text-center">
            <div className="flex-1 w-full flex items-start justify-center">
              <div className="w-full max-w-[320px] py-30 text-center">
                <h1 className="font-bold tracking-tight font-primary leading-[1.05] text-3xl sm:text-4xl text-slate-900">
                  Own a
                  <br />
                  Premium Bakery
                  <br />
                  Franchise
                </h1>

                <p className="mt-12 text-lg font-medium font-primary leading-6 text-slate-600">
                  Be part of a fast-growing bakery brand
                  from The FreshlyMade, trusted for over 13 years.
                </p>

                <p className="mt-8 text-sm font-secondary leading-4 text-slate-400">
                  Get full support from setup and chef
                  <br />
                  training to operations and marketing success.
                </p>

                <img
                  src="/logo.png"
                  alt="Cake Stories"
                  className="mx-auto mt-10 h-15 opacity-90"
                  draggable="false"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="mt-8 w-full rounded-lg font-primary bg-[#007AFF] text-white font-semibold py-3 shadow-[0_6px_16px_rgba(0,122,255,0.25)] active:scale-[0.99] transition"
            >
              Continue
            </button>
          </section>
        )}

        {/* Step 1: Name/Phone/Email */}
        {step === 1 && (
          <section className="pt-2 pb-6">
            {/* local back */}
            <div className="flex items-center justify-between -mt-2 mb-10">
              <button
                className="w-full rounded-lg font-primary bg-[#007AFF] text-white font-semibold py-2 shadow-[0_6px_16px_rgba(0,122,255,0.25)] transition"
                onClick={() => setStep(0)}
              >
                &lt; Back
              </button>
              <img src="/logo.png" alt="Cake Stories" className="h-15" />
              <span className="w-[18px]" />
            </div>

            <FieldBlock
              label="Name"
              hint="We’d love to know who we’re speaking with."
              value={lead.name || ""}
              onChange={(v) => setLead((s) => ({ ...s, name: v }))}
              placeholder="What’s your full name?"
              valid={validName(lead.name)}
            />

            <FieldBlock
              label="Phone Number"
              hint="Our franchise team will call or WhatsApp you within 24 hours."
              value={lead.phone || ""}
              onChange={(v) => setLead((s) => ({ ...s, phone: v }))}
              placeholder="Could you share your mobile number?"
              type="tel"
              valid={validPhone(lead.phone)}
            />

            <FieldBlock
              label="Email"
              hint="We’ll send your Cake Stories franchise brochure and setup details."
              value={lead.email || ""}
              onChange={(v) => setLead((s) => ({ ...s, email: v }))}
              placeholder="Please share your email address"
              type="email"
              valid={validEmail(lead.email)}
            />

            <button
              onClick={onContinueStep1}
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-[#007AFF] text-white font-primary font-semibold py-3
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
            <img src="/logo.png" alt="" className="h-15 mb-10" />

            <h2 className="text-4xl font-primary font-bold mb-4">Mr. {firstName(lead.name)},</h2>
            <p className="text-xl font-secondary text-black/60 mt-5 mb-10">which best describes you?</p>

            <OptionAutoAdvanceList
              onPick={(val) => saveAndGo("role", val)}
              options={[
                { label: "I’m a Business Owner", value: "Business Owner" },
                { label: "I’m an Investor", value: "Investor" },
                { label: "I’m Exploring new franchise opportunities", value: "Exploring" },
              ]}
            />

            <div className="flex items-center justify-between mt-10">
              <button className="text-xl rounded-lg font-primary border border-[#007AFF] px-5 py-2  text-[#007AFF]" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="rounded-lg bg-[#007AFF] text-white text-xl font-semibold px-5 py-2 opacity-60 cursor-default" disabled>
                Continue
              </button>
            </div>

            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </section>
        )}

        {/* Step 3: Business Owner → Business type (auto-advance with icons) */}
        {step === 3 && lead.role === "Business Owner" && (
          <section className="mt-10">
            <h2 className="text-4xl font-primary font-semibold mb-4">Mr. {firstName(lead.name)},</h2>
            <p className="text-lg font-secondary text-slate-500 -mt-1">tell us a bit about your business</p>

            <p className="text-xl font-secondary text-black/60 mt-5 mb-10">
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

            <div className="flex items-center justify-between mt-10">
              <button className="text-xl rounded-lg font-primary border border-[#007AFF] px-5 py-2  text-[#007AFF]" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="rounded-lg bg-[#007AFF] text-white text-xl font-primary font-semibold px-5 py-2 opacity-60 cursor-default" disabled>
                Continue
              </button>
            </div>

            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </section>
        )}

        {step === 4 && lead.role === "Business Owner" && (
          <section>
            <img src="/logo.png" alt="" className="h-15 mb-10" />

            <h2 className="text-4xl font-primary font-bold mb-4">Mr. {firstName(lead.name)},</h2>
            {/* <p className="text-lg font-secondary text-slate-500 -mt-1">tell us a bit about your business</p> */}

            <p className="text-xl font-secondary text-black/60 mt-5 mb-10">What’s your available investment range for expansion?</p>

            <OptionAutoAdvanceList
              onPick={(v) => saveAndGo("investment_range", v)}
              options={[
                { label: "₹18 L – ₹25 L", value: "₹18 L – ₹25 L" },
                { label: "₹26 L – ₹35 L", value: "₹26 L – ₹35 L" },
                { label: "Above ₹35 L", value: "Above ₹35 L" },
              ]}
            />

            <div className="flex items-center justify-between mt-10">
              <button className="text-xl rounded-lg font-primary border border-[#007AFF] px-5 py-2  text-[#007AFF]" onClick={() => setStep(3)}>
                Back
              </button>
              <button className="rounded-lg bg-[#007AFF] text-white text-xl font-semibold px-5 py-2 opacity-60 cursor-default" disabled>
                Continue
              </button>
            </div>

            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </section>
        )}

        {step === 5 && lead.role === "Business Owner" && (
          <section>
            <img src="/logo.png" alt="" className="h-15 mb-10" />

            <h2 className="text-4xl font-primary font-bold mb-4">Mr. {firstName(lead.name)},</h2>
            {/* <p className="text-lg font-secondary text-slate-500 -mt-1">tell us a bit about your business</p> */}

            <p className="text-xl font-secondary text-black/60 mt-5 mb-10">When is the best time for our team to reach you?</p>

            <OptionAutoAdvanceList
              options={[
                { label: "Morning (10 AM – 12 PM)", value: "Morning (10 AM – 12 PM)" },
                { label: "Afternoon (12 PM – 4 PM)", value: "Afternoon (12 PM – 4 PM)" },
                { label: "Evening (4 PM – 7 PM)", value: "Evening (4 PM – 7 PM)" },
              ]}
              onPick={(v) => saveAndGo({ contact_time: v }, 6)}
            />

            <div className="flex items-center justify-between mt-10">
              {/* FIX: back should return to step 4, not 1 */}
              <button className="text-xl rounded-lg font-primary border border-[#007AFF] px-5 py-2  text-[#007AFF]" onClick={() => setStep(4)}>
                Back
              </button>
              <button className="rounded-lg bg-[#007AFF] text-white text-xl font-semibold px-5 py-2 opacity-60 cursor-default" disabled>
                Continue
              </button>
            </div>

            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </section>
        )}

        {/* ===== Branch: Investor ===== */}
        {step === 3 && lead.role === "Investor" && (
          <section>
            <img src="/logo.png" alt="" className="h-15 mb-10" />

            <h2 className="text-4xl font-primary font-bold mb-4">Mr. {firstName(lead.name)},</h2>
            {/* <p className="text-lg font-secondary text-slate-500 -mt-1">tell us a bit about your business</p> */}

            <p className="text-xl font-secondary text-black/60 mt-5 mb-10">What type of franchise are you most interested in?</p>

            <OptionAutoAdvanceList
              options={[
                { label: "Food & Beverage Franchise", value: "Food & Beverage Franchise" },
                { label: "Café or Dessert Concept", value: "Café or Dessert Concept" },
                { label: "Premium Bakery Brand", value: "Premium Bakery Brand" },
                { label: "Open to explore options", value: "Open to explore options" },
              ]}
              onPick={(v) => saveAndGo("investor_interest", v)}
            />

            <div className="flex items-center justify-between mt-10">
              <button className="text-xl rounded-lg font-primary border border-[#007AFF] px-5 py-2  text-[#007AFF]" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="rounded-lg bg-[#007AFF] text-white text-xl font-semibold px-5 py-2 opacity-60 cursor-default" disabled>
                Continue
              </button>
            </div>

            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </section>
        )}

        {step === 4 && lead.role === "Investor" && (
          <section>
            <img src="/logo.png" alt="" className="h-15 mb-10" />

            <h2 className="text-4xl font-primary font-bold mb-4">Mr. {firstName(lead.name)},</h2>
            {/* <p className="text-lg font-secondary text-slate-500 -mt-1">tell us a bit about your business</p> */}

            <p className="text-xl font-secondary text-black/60 mt-5 mb-10">What’s your investment budget?</p>

            <OptionAutoAdvanceList
              options={[
                { label: "₹18 L – ₹25 L", value: "₹18 L – ₹25 L" },
                { label: "₹26 L – ₹35 L", value: "₹26 L – ₹35 L" },
                { label: "Above ₹35 L", value: "Above ₹35 L" },
              ]}
              onPick={(v) => saveAndGo("investor_budget", v)}
            />

            <div className="flex items-center justify-between mt-10">
              <button className="text-xl rounded-lg font-primary border border-[#007AFF] px-5 py-2  text-[#007AFF]" onClick={() => setStep(3)}>
                Back
              </button>
              <button className="rounded-lg bg-[#007AFF] text-white text-xl font-semibold px-5 py-2 opacity-60 cursor-default" disabled>
                Continue
              </button>
            </div>

            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </section>
        )}

        {step === 5 && lead.role === "Investor" && (
          <section>
            <img src="/logo.png" alt="" className="h-15 mb-10" />

            <h2 className="text-4xl font-primary font-bold mb-4">Mr. {firstName(lead.name)},</h2>
            {/* <p className="text-lg font-secondary text-slate-500 -mt-1">tell us a bit about your business</p> */}

            <p className="text-xl font-secondary text-black/60 mt-5 mb-10">When is a good time for us to contact you?</p>

            <OptionAutoAdvanceList
              options={[
                { label: "Morning (10 AM – 12 PM)", value: "Morning (10 AM – 12 PM)" },
                { label: "Afternoon (12 PM – 4 PM)", value: "Afternoon (12 PM – 4 PM)" },
                { label: "Evening (4 PM – 7 PM)", value: "Evening (4 PM – 7 PM)" },
              ]}
              onPick={(v) => saveAndGo({ investor_contact_time: v }, 6)}
            />

            <div className="flex items-center justify-between mt-10">
              <button className="text-xl rounded-lg font-primary border border-[#007AFF] px-5 py-2  text-[#007AFF]" onClick={() => setStep(4)}>
                Back
              </button>
              <button className="rounded-lg bg-[#007AFF] text-white text-xl font-semibold px-5 py-2 opacity-60 cursor-default" disabled>
                Continue
              </button>
            </div>

            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </section>
        )}

        {/* ===== Branch: Exploring ===== */}
        {step === 3 && lead.role === "Exploring" && (
          <section>
            <img src="/logo.png" alt="" className="h-15 mb-10" />

            <h2 className="text-4xl font-primary font-bold mb-4">Mr. {firstName(lead.name)},</h2>
            {/* <p className="text-lg font-secondary text-slate-500 -mt-1">tell us a bit about your business</p> */}

            <p className="text-xl font-secondary text-black/60 mt-5 mb-10">What kind of business are you most excited to start?</p>

            <OptionAutoAdvanceList
              options={[
                { label: "Food & Beverage or Café Concept", value: "Food & Beverage or Café Concept" },
                { label: "Bakery or Dessert Brand", value: "Bakery or Dessert Brand" },
                { label: "Quick-Service Restaurant (QSR)", value: "Quick-Service Restaurant (QSR)" },
                { label: "Still deciding", value: "Still deciding" },
              ]}
              onPick={(v) => saveAndGo("exploring_kind", v)}
            />

            <div className="flex items-center justify-between mt-10">
              <button className="text-xl rounded-lg font-primary border border-[#007AFF] px-5 py-2  text-[#007AFF]" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="rounded-lg bg-[#007AFF] text-white text-xl font-semibold px-5 py-2 opacity-60 cursor-default" disabled>
                Continue
              </button>
            </div>

            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </section>
        )}

        {step === 4 && lead.role === "Exploring" && (
          <section>
            <img src="/logo.png" alt="" className="h-15 mb-10" />

            <h2 className="text-4xl font-primary font-bold mb-4">Mr. {firstName(lead.name)},</h2>
            {/* <p className="text-lg font-secondary text-slate-500 -mt-1">tell us a bit about your business</p> */}

            <p className="text-xl font-secondary text-black/60 mt-5 mb-10">What’s your estimated investment capacity?</p>

            <OptionAutoAdvanceList
              options={[
                { label: "₹18 L – ₹25 L", value: "₹18 L – ₹25 L" },
                { label: "₹26 L – ₹35 L", value: "₹26 L – ₹35 L" },
                { label: "Above ₹35 L", value: "Above ₹35 L" },
              ]}
              onPick={(v) => saveAndGo("exploring_budget", v)}
            />

            <div className="flex items-center justify-between mt-10">
              <button className="text-xl rounded-lg font-primary border border-[#007AFF] px-5 py-2  text-[#007AFF]" onClick={() => setStep(3)}>
                Back
              </button>
              <button className="rounded-lg bg-[#007AFF] text-white text-xl font-semibold px-5 py-2 opacity-60 cursor-default" disabled>
                Continue
              </button>
            </div>

            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </section>
        )}

        {step === 5 && lead.role === "Exploring" && (
          <section>
            <img src="/logo.png" alt="" className="h-15 mb-10" />

            <h2 className="text-4xl font-primary font-bold mb-4">Mr. {firstName(lead.name)},</h2>
            {/* <p className="text-lg font-secondary text-slate-500 -mt-1">tell us a bit about your business</p> */}

            <p className="text-xl font-secondary text-black/60 mt-5 mb-10"> When are you planning to start your business?</p>

            <OptionAutoAdvanceList
              options={[
                { label: "Within 1 month", value: "Within 1 month" },
                { label: "1–3 months", value: "1–3 months" },
                { label: "3–6 months", value: "3–6 months" },
                { label: "Not sure yet", value: "Not sure yet" },
              ]}
              onPick={(v) => saveAndGo({ exploring_timeline: v }, 6)}
            />

            <div className="flex items-center justify-between mt-10">
              <button className="text-xl rounded-lg font-primary border border-[#007AFF] px-5 py-2  text-[#007AFF]" onClick={() => setStep(4)}>
                Back
              </button>
              <button className="rounded-lg bg-[#007AFF] text-white text-xl font-semibold px-5 py-2 opacity-60 cursor-default" disabled>
                Continue
              </button>
            </div>

            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </section>
        )}

        {/* Step 6: Thank-you screen */}
        {step === 6 && (
          <section className="text-center pt-20 pb-8">
            <div className="mx-auto h-30 w-30 rounded-full grid place-items-center">
              <img src="/smily.png" alt="" className="h-30 w-30" />
            </div>

            <h2 className="mt-12 text-4xl leading-tight font-secondary font-bold text-black/90 text-center">
  Thank you <span className="text-black">{firstName(lead.name)}</span><br />
  <span>for your interest</span><br />
  <span>in Cake Stories</span>
</h2>


            <p className="mt-8 text-xl font-secondary leading-6 text-slate-600">
              Our franchise team will connect with you soon to
              discuss your preferred city and model options.
            </p>
            <p className="mt-6 text-lg font-secondary  text-slate-400">
              Get ready to start your sweet success story!
            </p>

            <button
              onClick={downloadBrochure}
              className="mt-6 inline-flex flex-col border border-blue-300 hover rounded-lg py-2 px-5 cursor-pointer items-center justify-center"
              aria-label="Download Brochure"
            >
              <span className="text-2xl font-semibold text-black/90">
                Download Brochure
              </span>
              <img src="/down.png" alt="" className="mt-2 h-6 w-6" />
            </button>

            <button
              onClick={() => {
                const msg = `Hi, I'm ${firstName(lead.name)}. I just submitted the Cake Stories franchise form. Please share the brochure and next steps.`;
                const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="mt-8 w-full rounded-lg bg-[#007AFF]  cursor-pointer  text-white font-semibold py-3
               shadow-[0_8px_20px_rgba(0,122,255,0.28)] active:scale-[0.99] font-primary transition"
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
  // show steps only for 1..total (landing is 0)
  const showSteps = step > 0 && step <= total;
  const current = Math.min(Math.max(step, 1), total);
  const pct = Math.round((current / total) * 100);

  return (
    <header className="sticky top-0 z-10 bg-white">
      <div className="mx-auto max-w-md px-5 pt-3">
        {/* top row */}
        <div className="flex items-center justify-between">
          <div className="min-w-[72px] text-[13px] font-semibold text-slate-700">
            {showSteps ? `Step ${current}` : ""}
          </div>
          <div className="min-w-[72px] text-right text-[13px] font-semibold text-indigo-600">
            {showSteps ? `${current} / ${total}` : ""}
          </div>
        </div>

        {/* progress */}
        {showSteps && (
          <div className="mt-3 mb-2">
            <div className="h-[2px] w-full rounded bg-slate-200">
              <div
                className="h-[2px] rounded bg-[#5B61F6] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/* ============ UI bits ============ */

function AutoIconSelect({ options, onPick }) {
  return (
    <ul className="space-y-8 mt-4">
      {options.map((opt) => (
        <li key={opt.value}>
          <button
            onClick={() => onPick(opt.value)}
            className="w-full rounded-xl font-secondary  px-4 py-4 text-left border transition bg-white
                       flex items-center gap-4 border-slate-200 hover:bg-slate-50
                       active:scale-[0.98]"
          >
            <img src={opt.img} alt="" className="h-10 w-10 object-contain" />
            <span className="text-2xl font-semibold text-slate-800">{opt.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function OptionAutoAdvanceList({ options, onPick }) {
  return (
    <ul className="space-y-8">
      {options.map((opt) => (
        <li key={opt.value}>
          <button
            onClick={() => onPick(opt.value)}
            className={[
              "w-full rounded-lg border font-secondary border-slate-200 bg-white",
              "px-4 py-5 text-center text-2xl font-semibold text-slate-900",
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
}) {
  return (
    <div className="mb-5 mt-6">
      <div className="text-xl font-primary font-bold text-left text-slate-900 mb-2">{label}</div>

      <input
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full rounded-lg border px-4 py-4 font-secondary font-medium text-lg leading-6",
          "bg-white placeholder:text-slate-400",
          "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]",
          valid
            ? "border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
            : "border-red-300 focus:outline-none focus:ring-2 focus:ring-red-300",
        ].join(" ")}
      />

      <p className="mt-2 text-base text-left leading-6 font-secondary text-black/40">{hint}</p>
    </div>
  );
}

/* ============ Validators ============ */
const firstName = (s) => (s ? String(s).trim().split(" ")[0] : "");
const validName = (s) => !!s && String(s).trim().length >= 3;
const validPhone = (s) => !!s && /^\+?[0-9]{10,15}$/.test(String(s));
const validEmail = (s) => !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s));
