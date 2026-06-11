import React, { useState } from "react";
import { faqData } from "./data";

// Hero variant flag. The chosen launch hero is "B" (calm / grief-sensitive).
// Hero A's efficiency-led copy is kept here so it can be A/B tested later.
type HeroVariant = "A" | "B";
const HERO_VARIANT: HeroVariant = "B";

const heroCopy: Record<HeroVariant, { eyebrow: string; titleEl: React.ReactNode; sub: string }> = {
  A: {
    eyebrow: "Probate, done properly",
    titleEl: (
      <>
        Probate done properly, for <span className="text-[#082D48]">£295</span>. Including your IHT
        forms.
      </>
    ),
    sub: "Upload your documents, we fill the PA1 and inheritance tax forms, you check and submit. Use it all free. Pay only when you’re ready.",
  },
  B: {
    eyebrow: "Start here, free",
    titleEl: <>Sorting out an estate? Start by finding out if you even need probate.</>,
    sub: "A few simple questions, a clear answer, and if you need it we’ll guide you through every step. Free to use. One fixed fee only when you submit.",
  },
};

interface LandingViewProps {
  onStartAssessment: () => void;
  onGoSecurity: () => void;
  onLogin: () => void;
}

const navyBtn =
  "inline-flex items-center justify-center gap-2.5 rounded-full bg-[#082D48] text-[#F6F0E7] cursor-pointer border-none transition-colors hover:bg-[#06223A]";
const creamBtn =
  "inline-flex items-center justify-center gap-2.5 rounded-full bg-[#F6F0E7] text-[#082D48] cursor-pointer border-none transition-colors hover:bg-white";

const LandingView: React.FC<LandingViewProps> = ({ onStartAssessment, onGoSecurity, onLogin }) => {
  const hero = heroCopy[HERO_VARIANT];
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="animate-ps-fade">
      {/* a. Sticky header */}
      <header className="sticky top-0 z-50 border-b border-[#E3D9C9] bg-[#F6F0E7]/[0.88] backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-6 py-[14px]">
          <a href="#top" className="inline-flex items-center gap-2.5 text-[#082D48] no-underline">
            <img src="/assets/swift_navy.png" alt="" className="block h-[34px] w-[34px]" />
            <span className="text-[20px] font-extrabold tracking-[-0.02em] text-[#082D48]">
              ProbateSwift
            </span>
          </a>
          <nav className="flex items-center gap-6 md:gap-7">
            <a href="#how" className="hidden text-[15px] font-medium text-[#5C6670] no-underline md:inline">
              How it works
            </a>
            <a href="#iht" className="hidden text-[15px] font-medium text-[#5C6670] no-underline md:inline">
              Inheritance tax
            </a>
            <a href="#pricing" className="hidden text-[15px] font-medium text-[#5C6670] no-underline md:inline">
              Pricing
            </a>
            <a href="#faq" className="hidden text-[15px] font-medium text-[#5C6670] no-underline md:inline">
              FAQ
            </a>
            <button
              onClick={onLogin}
              className="cursor-pointer border-none bg-transparent p-0 text-[15px] font-semibold text-[#082D48] hover:underline"
            >
              Log in
            </button>
            <button
              onClick={onStartAssessment}
              className={`${navyBtn} px-[22px] py-3 text-[15px] font-semibold`}
            >
              Check if you need probate
            </button>
          </nav>
        </div>
      </header>

      {/* b. Hero */}
      <section id="top" className="mx-auto max-w-[1160px] px-6 pb-10 pt-[72px]">
        <div className="grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-[56px]">
          <div>
            <div className="animate-ps-fade">
              <div className="mb-[22px] inline-flex items-center gap-2 rounded-full bg-[#E4EAF0] px-[14px] py-[7px] text-[13px] font-bold tracking-[0.02em] text-[#082D48]">
                {hero.eyebrow}
              </div>
              <h1 className="m-0 mb-5 max-w-[520px] text-[34px] font-extrabold leading-[1.06] tracking-[-0.025em] md:text-[54px]">
                {hero.titleEl}
              </h1>
              <p className="m-0 mb-[30px] max-w-[520px] text-[18px] leading-[1.55] text-[#5C6670] md:text-[20px]">
                {hero.sub}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onStartAssessment}
                className={`${navyBtn} px-[30px] py-[17px] text-[18px] font-bold`}
              >
                Check if you need probate <span className="text-[20px]">→</span>
              </button>
              <span className="text-[15px] font-medium text-[#8A8278]">
                5 minutes · free · no card to start
              </span>
            </div>
            <div className="mt-[30px] flex flex-wrap items-center gap-x-[22px] gap-y-3 text-[14px] font-semibold text-[#5C6670]">
              <span className="inline-flex items-center gap-[7px]">
                <span className="text-[#082D48]">✓</span> Built in the UK
              </span>
              <span className="inline-flex items-center gap-[7px]">
                <span className="text-[#082D48]">✓</span> Kept as secure as your bank details
              </span>
              <span className="inline-flex items-center gap-[7px]">
                <span className="text-[#082D48]">✓</span> No solicitor, no percentage
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-[24px] border border-[#E3D9C9] shadow-[0_30px_60px_-36px_rgba(8,45,72,0.4)]">
              <img
                src="/assets/hero.png"
                alt="A woman sorting estate paperwork at her kitchen table"
                className="block h-full w-full object-cover object-[50%_28%]"
              />
            </div>
            <div className="absolute -bottom-[22px] -left-[22px] max-w-[220px] rounded-[16px] border border-[#E3D9C9] bg-white px-[18px] py-4 shadow-[0_18px_40px_-24px_rgba(8,45,72,0.45)]">
              <div className="mb-1 text-[13px] font-semibold text-[#8A8278]">One flat fee</div>
              <div className="text-[30px] font-extrabold tracking-[-0.02em] text-[#082D48]">£295</div>
              <div className="text-[13px] text-[#5C6670]">
                Inheritance tax forms included. Paid only when you submit.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* c. Trust strip */}
      <section className="mx-auto max-w-[1160px] px-6 pb-4 pt-7">
        <div className="grid items-center gap-7 rounded-[22px] border border-[#E3D9C9] bg-white px-[30px] py-7 md:grid-cols-[1.3fr_1fr_1fr]">
          <div className="flex items-center gap-4">
            <img
              src="/assets/founder.png"
              alt="David, founder"
              className="block h-16 w-16 flex-shrink-0 rounded-full border border-[#E3D9C9] object-cover object-[50%_30%]"
            />
            <div>
              <div className="text-[16px] font-bold">A real person behind it</div>
              <div className="text-[14px] text-[#5C6670]">
                Built by the founder, who went through probate himself, not a faceless firm.
              </div>
            </div>
          </div>
          <div className="border-t border-[#E3D9C9] pt-7 md:border-l md:border-t-0 md:pl-7 md:pt-0">
            <div className="text-[16px] font-bold">Free until you submit</div>
            <div className="text-[14px] text-[#5C6670]">
              See your completed forms before paying anything. No card to start.
            </div>
          </div>
          <div className="border-t border-[#E3D9C9] pt-7 md:border-l md:border-t-0 md:pl-7 md:pt-0">
            <div className="text-[16px] font-bold">Your data, protected</div>
            <div className="text-[14px] text-[#5C6670]">
              Encrypted, never sold.{" "}
              <button
                onClick={onGoSecurity}
                className="cursor-pointer border-none bg-transparent p-0 text-[14px] font-semibold text-[#082D48] underline"
              >
                How we keep it safe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* d. "Do I need probate?" front door */}
      <section className="mx-auto max-w-[1160px] px-6 py-11">
        <div className="relative grid items-center gap-10 overflow-hidden rounded-[26px] bg-[#082D48] p-8 text-[#F6F0E7] md:grid-cols-[1.2fr_1fr] md:p-12">
          <img
            src="/assets/swift_white.png"
            alt=""
            className="pointer-events-none absolute -right-10 -top-[30px] w-[280px] opacity-[0.06]"
          />
          <div className="relative">
            <div className="mb-[14px] text-[13px] font-bold uppercase tracking-[0.12em] text-[#9FB4C8]">
              Do I need probate?
            </div>
            <h2 className="m-0 mb-[14px] text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] md:text-[36px]">
              Not everyone needs probate. Find out in five minutes, free, before you do anything else.
            </h2>
            <p className="m-0 text-[17px] leading-[1.55] text-[#C5D2DC]">
              Answer a few plain questions about the will, the property and the accounts. We’ll tell
              you honestly whether you need probate, whether there’s inheritance tax to deal with, and
              what it would cost. No signup to see your answer.
            </p>
          </div>
          <div className="relative flex flex-col items-start gap-[14px]">
            <button
              onClick={onStartAssessment}
              className={`${creamBtn} px-8 py-[18px] text-[18px] font-bold`}
            >
              Start the free assessment <span className="text-[20px]">→</span>
            </button>
            <span className="text-[14px] text-[#9FB4C8]">
              A straight answer, free — even if it means telling you we’re not the right fit
            </span>
          </div>
        </div>
      </section>

      {/* e. How it works */}
      <section id="how" className="mx-auto max-w-[1160px] px-6 py-16">
        <div className="mb-11 max-w-[640px]">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-[#8A8278]">
            How it works
          </div>
          <h2 className="m-0 text-[32px] font-extrabold leading-[1.08] tracking-[-0.025em] md:text-[40px]">
            Three steps. Forms that take most people days, done in an afternoon.
          </h2>
        </div>
        <div className="grid gap-[22px] md:grid-cols-3">
          {[
            {
              n: "1",
              h: "Tell us about the estate",
              p: "A few questions about the estate — everything they owned, like the home, money and accounts. Around five minutes.",
            },
            {
              n: "2",
              h: "Get your answer and your plan",
              p: "Whether probate is needed, whether there’s inheritance tax to deal with, what it’ll cost, and the exact next steps. If it’s too complex, we say so.",
            },
            {
              n: "3",
              h: "We do the heavy lifting",
              p: "We fill your probate and inheritance tax forms from your answers. You check and submit. Pay one fixed fee only when you’re ready.",
            },
          ].map((s) => (
            <div key={s.n} className="rounded-[20px] border border-[#E3D9C9] bg-white p-[30px]">
              <div className="mb-[18px] flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#E4EAF0] font-extrabold text-[#082D48]">
                {s.n}
              </div>
              <h3 className="m-0 mb-2.5 text-[21px] font-bold">{s.h}</h3>
              <p className="m-0 text-[16px] leading-[1.55] text-[#5C6670]">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* f. Inheritance tax wedge */}
      <section id="iht" className="border-y border-[#E3D9C9] bg-[#EFE7DA]">
        <div className="mx-auto max-w-[1160px] px-6 py-[72px]">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div>
              <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-[#B5613C]">
                Inheritance tax
              </div>
              <h2 className="m-0 mb-[18px] text-[32px] font-extrabold leading-[1.06] tracking-[-0.025em] md:text-[42px]">
                Your inheritance tax forms, completed and included.
              </h2>
              <p className="m-0 mb-6 text-[19px] leading-[1.55] text-[#5C6670]">
                A solicitor charges around <strong className="text-[#1E2A33]">£1,290</strong> just for
                the inheritance tax forms. We complete them from the documents you upload, included in
                your £295.
              </p>
              <button
                onClick={onStartAssessment}
                className={`${navyBtn} px-[26px] py-[15px] text-[16px] font-bold`}
              >
                See if this applies to you →
              </button>
            </div>
            <div className="rounded-[20px] border border-[#E3D9C9] bg-white p-8">
              <h3 className="m-0 mb-[18px] text-[18px] font-bold">What we handle for you</h3>
              <div className="flex flex-col gap-4">
                {[
                  {
                    h: "The shorter tax form",
                    p: "For most estates under £325,000, where there’s no tax to pay, we fill in the shorter form for you.",
                  },
                  {
                    h: "The longer tax form",
                    p: "When the estate is larger, we complete the longer form and its extra pages from your figures.",
                  },
                  {
                    h: "A late husband or wife’s allowance",
                    p: "If your husband or wife died first, we use their unused tax-free allowance too, so you don’t pay tax you don’t owe — often up to £650,000 tax-free.",
                  },
                  {
                    h: "Extra allowance for the family home",
                    p: "If the home passes to children or grandchildren, there’s an extra tax-free allowance, and we claim it for you.",
                  },
                ].map((it) => (
                  <div key={it.h} className="flex gap-[13px]">
                    <span className="font-extrabold text-[#082D48]">✓</span>
                    <div>
                      <div className="text-[15px] font-bold">{it.h}</div>
                      <div className="text-[14px] text-[#5C6670]">{it.p}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* g. Pricing + comparison */}
      <section id="pricing" className="mx-auto max-w-[1160px] px-6 py-[72px]">
        <div className="mb-10 max-w-[640px]">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-[#8A8278]">
            Pricing
          </div>
          <h2 className="m-0 mb-[14px] text-[32px] font-extrabold leading-[1.06] tracking-[-0.025em] md:text-[42px]">
            £295, all in. Paid only when you submit.
          </h2>
          <p className="m-0 text-[19px] leading-[1.55] text-[#5C6670]">
            One flat fee. Not £1,290 for IHT forms. Not from £2,750 for full administration. Not 2 to
            4% of the estate.
          </p>
        </div>
        <div className="overflow-hidden rounded-[22px] border border-[#E3D9C9] bg-white">
          <div className="grid grid-cols-[1.4fr_1.4fr_1fr] border-b border-[#E3D9C9] bg-[#F6F0E7] px-[28px] py-[18px] text-[12px] font-bold uppercase tracking-[0.06em] text-[#8A8278] md:text-[13px]">
            <div>Provider</div>
            <div>Service</div>
            <div className="text-right">Typical cost</div>
          </div>
          {[
            { p: "A solicitor", s: "Inheritance tax forms only", c: "£1,290", sub: null },
            {
              p: "Full administration service",
              s: "They handle the whole estate",
              c: "from £2,750",
              sub: null,
            },
            {
              p: "A bank or trust corporation",
              s: "Percentage of the estate",
              c: "£6,000–£12,000",
              sub: "2–4% on a £300k estate",
            },
          ].map((row) => (
            <div
              key={row.p}
              className="grid grid-cols-[1.4fr_1.4fr_1fr] items-center border-b border-[#EFE7DA] px-[28px] py-[22px]"
            >
              <div className="text-[15px] font-semibold md:text-[16px]">{row.p}</div>
              <div className="text-[14px] text-[#5C6670] md:text-[16px]">{row.s}</div>
              <div className="text-right text-[15px] font-bold md:text-[17px]">
                {row.c}
                {row.sub && (
                  <span className="block text-[12px] font-medium text-[#8A8278]">{row.sub}</span>
                )}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-[1.4fr_1.4fr_1fr] items-center bg-[#E4EAF0] px-[28px] py-6">
            <div className="text-[15px] font-extrabold text-[#082D48] md:text-[16px]">ProbateSwift</div>
            <div className="text-[14px] font-semibold text-[#082D48] md:text-[16px]">
              You fill it in with our help, tax forms included
            </div>
            <div className="text-right text-[22px] font-extrabold text-[#082D48] md:text-[24px]">
              £295
            </div>
          </div>
        </div>
        <div className="mt-[26px] flex flex-wrap items-center justify-between gap-6 rounded-[18px] bg-[#1E2A33] px-8 py-7 text-[#F6F0E7]">
          <div className="text-[20px] font-bold leading-[1.3] tracking-[-0.01em] md:text-[24px]">
            A bank could charge £8,000 to administer a simple estate.
            <br />
            <span className="text-[#9FB4C8]">We charge £295.</span>
          </div>
          <button
            onClick={onStartAssessment}
            className="inline-flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-full border-none bg-[#F6F0E7] px-[26px] py-[15px] text-[16px] font-bold text-[#1E2A33] transition-colors hover:bg-white"
          >
            Check your estate →
          </button>
        </div>
      </section>

      {/* h. Two promise cards */}
      <section className="mx-auto max-w-[1160px] px-6 pb-16 pt-5">
        <div className="grid gap-[22px] md:grid-cols-2">
          <div className="rounded-[22px] border border-[#E3D9C9] bg-white p-[38px]">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#E4EAF0] text-[22px] text-[#082D48]">
              ☑
            </div>
            <h3 className="m-0 mb-3 text-[26px] font-extrabold tracking-[-0.02em]">
              Get it right, without a solicitor
            </h3>
            <p className="m-0 text-[17px] leading-[1.55] text-[#5C6670]">
              Every figure is checked before you submit. We check your forms against what HMRC (the
              tax office) and the government probate office require, and flag anything that looks
              wrong, so you apply with confidence, not guesswork.
            </p>
          </div>
          <div className="rounded-[22px] border border-[#E3D9C9] bg-white p-[38px]">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#F2E2D8] text-[22px] text-[#B5613C]">
              ⏳
            </div>
            <h3 className="m-0 mb-3 text-[26px] font-extrabold tracking-[-0.02em]">
              Use the entire service free
            </h3>
            <p className="m-0 text-[17px] leading-[1.55] text-[#5C6670]">
              Fill everything in, see your completed forms, change your mind at any point. Pay £295
              only when you submit. No card needed to start, no pressure.
            </p>
          </div>
        </div>
      </section>

      {/* i. Included / Not / Solicitor */}
      <section className="border-y border-[#E3D9C9] bg-[#EFE7DA]">
        <div className="mx-auto max-w-[1160px] px-6 py-16">
          <div className="grid gap-[22px] md:grid-cols-3">
            <div className="rounded-[20px] border border-[#E3D9C9] bg-white p-[30px]">
              <h3 className="m-0 mb-4 text-[19px] font-extrabold text-[#082D48]">What’s included</h3>
              <div className="flex flex-col gap-[11px] text-[15px] text-[#1E2A33]">
                {[
                  "The free “do I need probate?” assessment",
                  "Guided, step-by-step questions",
                  "The main probate application form, completed",
                  "Completed inheritance tax forms",
                  "We double-check everything before you send it",
                  "Help when you send the application off",
                ].map((t) => (
                  <div key={t} className="flex gap-2.5">
                    <span className="text-[#082D48]">✓</span> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[20px] border border-[#E3D9C9] bg-white p-[30px]">
              <h3 className="m-0 mb-4 text-[19px] font-extrabold text-[#8A8278]">What’s not included</h3>
              <div className="flex flex-col gap-[11px] text-[15px] text-[#5C6670]">
                {[
                  "The government probate office fee (£300)",
                  "Extra copies of the official document (£16 each)",
                  "Selling a home (the legal work to sell it)",
                  "Stockbroker or third-party costs",
                ].map((t) => (
                  <div key={t} className="flex gap-2.5">
                    <span className="text-[#B5613C]">·</span> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[20px] border border-[#E3D9C9] bg-white p-[30px]">
              <h3 className="m-0 mb-4 text-[19px] font-extrabold text-[#1E2A33]">
                When you’d still need a solicitor
              </h3>
              <p className="m-0 mb-[14px] text-[14px] text-[#8A8278]">
                If any of these apply, we’ll tell you in the assessment and point you to a solicitor.
              </p>
              <div className="flex flex-col gap-[11px] text-[15px] text-[#5C6670]">
                {[
                  "A disputed or contested will",
                  "Trusts (where someone holds assets for others)",
                  "Money or property abroad",
                  "An estate that owes more than it’s worth",
                ].map((t) => (
                  <div key={t} className="flex gap-2.5">
                    <span className="text-[#B5613C]">·</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* j. Timelines */}
      <section className="mx-auto max-w-[1160px] px-6 py-[72px]">
        <div className="mb-11 max-w-[640px]">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-[#8A8278]">
            Timelines
          </div>
          <h2 className="m-0 text-[32px] font-extrabold leading-[1.08] tracking-[-0.025em] md:text-[40px]">
            Here’s exactly what happens, and how long it takes.
          </h2>
        </div>
        <div className="relative grid grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-0">
          <div className="absolute left-[8%] right-[8%] top-[26px] hidden h-0.5 bg-[#E3D9C9] md:block" />
          {[
            {
              n: "1",
              h: "Upload your documents",
              when: "Minutes",
              p: "The will, account statements and property details.",
              clay: false,
            },
            {
              n: "2",
              h: "We fill the forms, you check them",
              when: "Same day",
              p: "We fill the probate and inheritance tax forms. You check every figure.",
              clay: false,
            },
            {
              n: "3",
              h: "Submit",
              when: "Pay £295 here",
              p: "You apply to HMRC and the government probate office with confidence.",
              clay: false,
            },
            {
              n: "4",
              h: "The document arrives",
              when: "~8–12 weeks",
              p: "Current government processing time, not us.",
              clay: true,
            },
          ].map((s) => (
            <div key={s.n} className="relative pr-4">
              <div
                className={`mb-[18px] flex h-[54px] w-[54px] items-center justify-center rounded-full font-extrabold text-[#F6F0E7] ${
                  s.clay ? "bg-[#B5613C]" : "bg-[#082D48]"
                }`}
              >
                {s.n}
              </div>
              <div className="mb-1.5 text-[17px] font-bold">{s.h}</div>
              <div className="mb-1.5 text-[14px] font-semibold text-[#8A8278]">{s.when}</div>
              <p className="m-0 text-[14px] text-[#5C6670]">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* k. Founder section */}
      <section className="mx-auto max-w-[1160px] px-6 pb-[72px] pt-5">
        <div className="grid items-center gap-11 rounded-[26px] border border-[#E3D9C9] bg-white p-8 md:grid-cols-[0.8fr_1.2fr] md:p-12">
          <div className="aspect-square overflow-hidden rounded-[20px] border border-[#E3D9C9]">
            <img
              src="/assets/founder.png"
              alt="David, founder of ProbateSwift"
              className="block h-full w-full object-cover object-[50%_30%]"
            />
          </div>
          <div>
            <div className="mb-[14px] text-[13px] font-bold uppercase tracking-[0.12em] text-[#8A8278]">
              Who’s behind this
            </div>
            <h2 className="m-0 mb-4 text-[26px] font-extrabold leading-[1.12] tracking-[-0.02em] md:text-[32px]">
              “I built ProbateSwift after doing probate myself, with no idea where to start.”
            </h2>
            <p className="m-0 mb-[14px] text-[17px] leading-[1.6] text-[#5C6670]">
              I’m not a solicitor. I’m someone who was handed this job while grieving and found it
              confusing, slow and quietly expensive. ProbateSwift is the tool I wish I’d had: it walks
              you through the questions, fills the forms, and checks them before you submit, for a
              fraction of what I was quoted.
            </p>
            <p className="m-0 text-[17px] leading-[1.6] text-[#5C6670]">
              For disputes, trusts or anything genuinely complex, we’ll always tell you to see a
              solicitor. For a straightforward estate, you really can do this yourself, with help.
            </p>
            <div className="mt-[22px] text-[16px] font-bold">
              David <span className="font-medium text-[#8A8278]">· Founder, ProbateSwift</span>
            </div>
          </div>
        </div>
      </section>

      {/* l. FAQ */}
      <section id="faq" className="border-t border-[#E3D9C9] bg-[#EFE7DA]">
        <div className="mx-auto max-w-[880px] px-6 py-[72px]">
          <h2 className="m-0 mb-9 text-center text-[32px] font-extrabold leading-[1.08] tracking-[-0.025em] md:text-[40px]">
            Questions, answered plainly
          </h2>
          <div className="flex flex-col gap-3">
            {faqData.map((item, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-[16px] border border-[#E3D9C9] bg-white"
                >
                  <button
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent px-[26px] py-[22px] text-left text-[18px] font-bold text-[#1E2A33]"
                  >
                    <span>{item.q}</span>
                    <span className="flex-shrink-0 text-[24px] text-[#082D48]">
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  {open && (
                    <div className="px-[26px] pb-6 text-[16px] leading-[1.6] text-[#5C6670]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* m. Final CTA */}
      <section className="relative overflow-hidden bg-[#082D48]">
        <img
          src="/assets/swift_white.png"
          alt=""
          className="pointer-events-none absolute -bottom-[60px] -left-[60px] w-[320px] opacity-[0.06]"
        />
        <div className="relative mx-auto max-w-[880px] px-6 py-[84px] text-center">
          <h2 className="m-0 mb-4 text-[32px] font-extrabold leading-[1.08] tracking-[-0.025em] text-[#F6F0E7] md:text-[44px]">
            Find out if you need probate. It’s free, and it takes five minutes.
          </h2>
          <p className="mx-auto m-0 mb-8 max-w-[560px] text-[19px] text-[#C5D2DC]">
            Start the assessment, get an honest answer, and if you’re a good fit, join the first group
            of families we’re opening to.
          </p>
          <button
            onClick={onStartAssessment}
            className={`${creamBtn} px-9 py-[19px] text-[19px] font-bold`}
          >
            Check if you need probate <span className="text-[22px]">→</span>
          </button>
          <div className="mt-[18px] text-[15px] text-[#9FB4C8]">
            No card to start · built in the UK · your data is never sold
          </div>
        </div>
      </section>

      {/* n. Footer */}
      <footer className="bg-[#06223A] text-[#9FB4C8]">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-start justify-between gap-8 px-6 py-12">
          <div className="max-w-[320px]">
            <div className="mb-[14px] inline-flex items-center gap-2.5">
              <img src="/assets/swift_white.png" alt="" className="block h-[30px] w-[30px]" />
              <span className="text-[18px] font-extrabold text-[#F6F0E7]">ProbateSwift</span>
            </div>
            <p className="m-0 text-[14px] leading-[1.6]">
              Guided probate and inheritance tax forms for straightforward estates in England &amp;
              Wales. One flat fee, paid only when you submit.
            </p>
          </div>
          <div className="flex flex-wrap gap-14">
            <div className="flex flex-col gap-2.5 text-[14px]">
              <a href="#how" className="text-[#9FB4C8] no-underline">
                How it works
              </a>
              <a href="#pricing" className="text-[#9FB4C8] no-underline">
                Pricing
              </a>
              <a href="#faq" className="text-[#9FB4C8] no-underline">
                FAQ
              </a>
              <button
                onClick={onGoSecurity}
                className="cursor-pointer border-none bg-transparent p-0 text-left text-[14px] text-[#9FB4C8]"
              >
                Security
              </button>
            </div>
            <div className="max-w-[300px] text-[13px] leading-[1.7] opacity-80">
              ProbateSwift is not a law firm and does not provide legal advice. For disputed wills,
              trusts, overseas assets or insolvent estates, please consult a solicitor.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
