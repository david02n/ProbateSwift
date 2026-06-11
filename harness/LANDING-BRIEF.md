# ProbateSwift — Landing Page Rewrite Brief

Supersedes `LANDING-COPY.md` (smoke-test draft) and folds in the competitor copy gap analysis.
Purpose: a full rewrite that does two jobs at once — acquire via the free assessment, and prove
people will pay for the happy-path journey.

Price is **£295, decided** (David, 2026-06-11) — acquisition-first, get people in. No price test for now.

---

## 1. Objective

Acquisition and proof of value. Get hesitant, grieving buyers to start the free assessment, reach a
"you're a good fit" result, accept the price, and join early access. This is still a smoke test: the
end-to-end build isn't finished, so the page promises the full experience and captures intent.

**Success metrics:** assessment starts → completions → "good fit" rate → "see your fixed price"
clicks → early-access signups. Those four conversions tell you if the offer pulls and the price lands.

## 2. Audience and mindset

A grieving layperson in England & Wales (named executor, spouse, adult child) who has just been handed
a job they don't understand and are scared of getting wrong. First three questions in their head, in
order: *Can I trust this? Am I exposed if I get it wrong? What will it cost?* The page must answer them
in that order, early and plainly. Reassure, don't sell.

## 3. Positioning

- **Offer, one line:** Find out if you need probate in 5 minutes, free. If you do, we guide you through
  it and fill your forms. One fixed fee, paid only when you're ready to submit. No solicitor, no percentage.
- **The wedge:** the free "Do I need probate?" assessment. Ungated, spreads, and honestly turns away the
  hard cases.
- **The differentiators, ranked:** (1) we complete your IHT forms, included; (2) free until you submit,
  no card to start; (3) one flat fee vs £1,290 for IHT forms / 2–4% to a bank.
- **The villain:** the £1,290+ solicitor IHT bill and the 2–4% bank fee.
- **The scope:** the happy path (valid will, one executor, one property, a few accounts, straightforward
  IHT400). Hard cases triaged out — which is itself a trust signal.

## 4. Voice and rules

Plain, calm, warm, confident. Short sentences. No hype, no jargon, no AI clichés, no em-dashes. Never
claim a credential, rating, or number that isn't true (see "Facts to confirm"). Two tonal variants to
split-test: an efficiency-led version and a calmer grief-sensitive version.

## 5. Message hierarchy (what must land, in order)

1. You can trust this. (ratings/credentials/security, or a named human if reviews are thin)
2. You won't get it wrong. (validation / pre-submission checks)
3. We do the IHT forms others charge £1,290 for, included.
4. One flat fee, and it's a fraction of everyone else.
5. Free until you submit, no card to start.
6. Here's exactly what happens and how long it takes.
7. Here's what's included, what isn't, and when you'd still need a solicitor.

---

## 6. Page structure (section by section)

### Hero
Job: state the offer and price, and plant one trust signal, above the fold.

Variant A (efficiency-led, test as default):
> **Probate done properly, for £295. Including your IHT forms.**
> Upload your documents, we fill the PA1 and inheritance tax forms, you check and submit. Use it all
> free. Pay only when you're ready.
> [rating if true] · UK-built · No card to start
> **[Check if you need probate]**

Variant B (calm/grief-sensitive):
> **Sorting out an estate? Start by finding out if you even need probate.**
> A few simple questions, a clear answer, and if you need it we'll guide you through every step. Free
> to use. One fixed fee only when you submit.
> **[Check if you need probate]**

### Trust strip (directly under hero CTA) — HIGHEST PRIORITY
Job: answer "can I trust this?" before they scroll. **Reality check: no users, reviews, credentials, or
named advisor today.** Do NOT use ratings, review counts, "X families helped", or invented authority.
The trust load sits on the three signals that ARE true:
- **Risk reversal (lead with this):** "Free to use. No card to start. Pay only when you submit." Nobody
  can lose money, so they don't need a review to feel safe. This is the strongest card.
- **Borrowed authority:** "Built on HMRC and Probate Registry requirements." Align with the official
  process the reader already half-trusts.
- **Concrete security (if true):** encrypted, never sold, you control submission, UK-built.
No hero testimonial (none exist). A light founder line is optional (see Founder block).

### "Do I need probate?" front door
Job: the assessment is the hook — keep it prominent. Ungated result, no signup to see the answer.
Short line: *Not everyone needs probate. Find out in five minutes, free, before you do anything else.*

### How it works (3 steps, concrete)
1. **Tell us about the estate.** A few questions about the will, the property and the accounts. ~5 minutes.
2. **Get your answer and your plan.** Whether probate is needed, whether there's inheritance tax to deal
   with, what it'll cost, and the exact next steps. If it's too complex, we say so.
3. **We do the heavy lifting.** We fill your probate and IHT forms from your answers. You check and submit.
   Pay one fixed fee only when you're ready.
Replace "cutting weeks off" with the specific removal: *Forms that take most people days, done in an afternoon.*

### Inheritance tax (the sharpest wedge) — promote near the top
Job: make the IHT-forms-included message impossible to miss; it's what others charge most for.
> **Your IHT forms, completed and included.** A solicitor charges around £1,290 just for the inheritance
> tax forms. We complete them from the documents you upload, included in your £295.
Add a substantive sub-block: which forms apply (IHT400 and schedules, or excepted-estate route),
the thresholds, transferable nil-rate band, so it reads as real expertise, not a checkbox.

### Price + comparison
Job: anchor £295 against the real market so the gap sells.
> **£295, all in.** Not £1,290 for IHT forms. Not £2,750 for full administration. Not 2 to 4% of the
> estate. One flat fee, paid only when you submit.
Include the comparison table (verify figures before publish — see Facts to confirm):

| Provider | Service | Price |
|---|---|---|
| GOV.UK DIY | Grant only, no help | ~£316 (fee only) |
| Budget online | Grant only, thin service | £195–£1,500 |
| Octopus Legacy | Grant, no IHT | £585 |
| Octopus Legacy | Grant with IHT forms | £1,290 |
| Farewill | Full administration | from £2,750* |
| Kings Court Trust | Grant of Probate | £1,995* |
| Banks / Co-op | Percentage of estate | ~2–4% (£6k–£12k on £300k) |
| **ProbateSwift** | **Guided self-serve + IHT forms** | **£295** |

One sharp acquisition line near here: *A bank could charge £8,000 to administer a simple estate. We
charge £295.*

### "Get it right, without a solicitor" (safety / validation)
Job: kill the "am I exposed if I get it wrong?" fear. Tie to the readiness-gate / pre-submission work.
> **Get it right, without a solicitor.** Every figure is checked before you submit. We validate your
> forms against HMRC and Probate Registry requirements and flag anything that looks wrong, so you apply
> with confidence, not guesswork.

### Free until you submit (a genuine edge nobody else has)
Job: elevate this from footnote to promise.
> **Use the entire service free. Pay £295 only when you submit.** Fill everything in, see your
> completed forms, change your mind at any point. No card needed to start.

### What's included / what's not + when you'd still need a solicitor
Job: scope honesty builds trust and prevents refunds.
- Included: the assessment, guided steps, completed PA1 and IHT forms, validation, submission support.
- Not included: the £300 registry fee and £16/copy, third-party costs (property sale, stockbroker).
- When to use a solicitor: disputed or contested wills, complex trusts, overseas assets, insolvent
  estates. Naming the boundary makes the core promise more believable.

### Timelines (concrete)
Job: read as competence. Show real durations:
upload (minutes) → forms auto-filled and reviewed (same day) → submit → grant from the Registry
(state current ~8–12 weeks). Don't be vague.

### Competence + founder block (replaces testimonials at launch)
No users, no quotes, no credentials — so the proof is the product itself. Show competence: screenshots of
the real forms, the validation catching an error, exactly what happens at each step. Visible precision is
the reassurance when there's no one to vouch for you.
Founder line is **optional and light** — a reason to exist, not a proof claim. If used, keep it to one or
two honest sentences (e.g. "I built this after watching my family struggle through probate") and only if
David is comfortable; the page stands up without it. Frame the stage as a virtue: "Be one of our first
families, with direct access to the founder." Swap in real testimonials once the pilot delivers them.

### FAQ (expand for reassurance + SEO)
Add: bank/institution thresholds (£5k–£50k), joint vs sole ownership and survivorship, who can apply
(executor vs administrator, bankruptcy, capacity), which IHT forms apply at what estate value, what
happens if the estate turns out too complex. Doubles as search landing content feeding the assessment.

### Final CTA + early-access capture (smoke test)
End the assessment with: *You're a good fit for ProbateSwift. We're opening to a first group of families
now — join the early-access list.* → email capture.

### Security page (separate, linked from trust strip)
Short page stating: data encrypted, never sold, you control submission. Farewill has one; it earns trust.

---

## 7. Price (decided)

**£295, flat, paid only at submission.** Chosen for acquisition: get people in, prove the value, learn
from real usage. The £1,290 IHT anchor makes £295 look extraordinary, which is the point. Revisit pricing
only after there's a base of users and the value is proven (a future WTP test, not now).

## 8. Trust with no users yet (cold-start)

No users, reviews, estates-helped numbers, credentials, or named advisor today, and none should be faked.
A founder story isn't proof — it's a reason to exist. The trust load sits on what's real:
1. **Risk reversal (primary):** free, no card, pay only at submission, check eligibility before signing up.
2. **Competence on display:** the real forms, the validation, exactly what happens at each step.
3. **Borrowed authority:** built on HMRC and Probate Registry requirements.
4. **Honesty:** "when you'd still need a solicitor" and "what's not included".
5. **Concrete security** (if true).
6. **Founding-family framing:** "be one of our first families, direct access to the founder" — not a fake count.
7. **Optional light founder line** — only if David's comfortable; not a proof claim.

**Fastest path to real proof:** run a pilot. Give the first 5–10 families the service free or half-price
in exchange for feedback and, if happy, a testimonial. Swap real quotes in as they arrive. This is the
only thing that becomes genuine social proof.

## 9. Facts to confirm before publish (must be true)

- Founder credentials and any named advisor's qualifications — confirm and get permission to name.
- Security claims (encryption standard, "never sold") — confirm they're accurate.
- "Built on HMRC / Probate Registry requirements" — fair to say, keep it accurate.
- Do NOT use ratings, review counts, or families-helped numbers until they're real.
- Comparison-table figures marked `*` (Farewill full admin, KCT grant) — re-verify on their sites; the
  Octopus £585/£1,290 and GOV.UK ~£316 are confirmed (2026-06-11).

## 10. Test plan

- Split-test Hero A (efficiency) vs Hero B (calm).
- Measure the four-step funnel in §1 (assessment starts → completions → "good fit" → "see price" → signups).
- Keep what's already working: the assessment front door, free-until-submit/no-card, and the clean
  upload → auto-fill → submit three-step.
