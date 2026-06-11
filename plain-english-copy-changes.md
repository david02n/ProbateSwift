# Plain-English copy changes

Source: plain-language review of the live site (probateswift.com), read from the
point of view of a non-technical, first-time user (recently bereaved, no probate
experience). Goal: nobody should hit a word that makes them stop, frown, or give
up and ring a solicitor.

File hints are best-effort pointers to where each string lives:
- `client/src/components/landing-relaunch/LandingView.tsx`
- `client/src/components/landing-relaunch/SecurityView.tsx`
- `client/src/components/landing-relaunch/data.ts` (assessment questions, result copy, FAQ)

---

## Priority 1 — internal notes leaked onto the live page

These read like instructions to the writer, not customer copy. Fix first.

| Current (live) | Problem | Suggested |
|---|---|---|
| "Naming the boundary makes the promise believable. We'll tell you in the assessment." | Writer's note, visible under *When you'd still need a solicitor*. | "If any of these apply, we'll tell you in the assessment and point you to a solicitor." |
| "Ungated result · honest answer · turns away the hard cases" | "Ungated" is meaningless to users; "turns away the hard cases" sounds like an internal note. | "A straight answer, free, even if it means telling you we're not the right fit." |

File hint: `LandingView.tsx`.

---

## Priority 2 — baffling legal/tax jargon

No ordinary user knows these terms. Replace, or define on first use.

| Current | Suggested |
|---|---|
| "Excepted-estate route" / "excepted-estate reporting" | "the shorter tax form, for when there's no tax to pay" |
| "Transferable nil-rate band" | "If your husband or wife died first, you can use their unused tax-free allowance too, so you don't pay tax you don't owe." |
| "Residence nil-rate band" | "If the home passes to children or grandchildren, there's an extra tax-free allowance we'll claim for you." |
| "nil-rate band" (general) | "tax-free allowance" |
| "The full IHT400 and its schedules" | "the longer tax form (and its extra pages)" |
| "PA1" / "Completed PA1 probate form" | "the main probate application form" |
| "Joint tenants" / "passes by survivorship" | "owned together, so it passes straight to the other person" |
| "Tenants in common" | "owned in separate shares" |
| "Letters of administration" | "permission to deal with the estate when there's no will" |
| "Grant of probate" / "the grant" | "the official document that lets you deal with the estate" (then "the document" on later mentions) |

File hints: Inheritance-tax section, "What's included/not included", and TIMELINES in `LandingView.tsx`; `faqData` and the `owned_property` question in `data.ts`.

---

## Priority 3 — half-clear terms (define on first use)

Users might guess, but shouldn't have to.

| Current | Suggested |
|---|---|
| "Estate" (used throughout, undefined) | First use: "the estate (everything the person owned: money, home and belongings)" |
| "Executor" / "administrator" | First use: "the person allowed to sort it all out" |
| "Threshold" | "the limit" / "the cut-off" |
| "Insolvent" / "the estate may be insolvent" | "owes more than it's worth" |
| "Conveyancing" | "the legal work to sell a home" |
| "NS&I" | "National Savings (NS&I) or Premium Bonds" |
| "Probate Registry" | "the government probate office" |
| "HMRC" | First use: "HMRC (the tax office)" |
| "Trust" / "trust corporation" | Add a short plain line, e.g. "a legal arrangement where someone holds assets for someone else" |

File hints: `faqData` and assessment questions in `data.ts`; pricing table and copy blocks in `LandingView.tsx`.

---

## Priority 4 — sounds like a computer, not a person

Tone fixes. Same meaning, warmer and clearer.

| Current | Suggested |
|---|---|
| "A named human behind the form logic" / "the form logic that prepares your application" | "A real person behind it, not a faceless firm." / "the tool that fills your forms" |
| "Pre-submission validation checks" | "we double-check everything before you send it" |
| "Forms auto-filled & reviewed" | "we fill the forms in for you, then you check them" |
| "Encrypted, end to end" / "encrypted in transit and at rest using bank-level standards" | "your details are kept private and secure, the same way banks protect yours" |
| "Bank-level encryption" (hero badge) | "kept as secure as your bank details" |
| "Guided self-serve + IHT forms included" (pricing table) | "you fill it in with our help, tax forms included" |
| "Submission support" | "help when you send the application off" |

File hints: hero trust row, badges and pricing table in `LandingView.tsx`; `SecurityView.tsx`.

---

## What's already good (leave alone)

- The assessment questions read like a real person talking, e.g. "Did the person
  who died leave a valid will?" Keep that voice.
- Warm, honest tone throughout. The jargon is concentrated in the money, tax and
  security sections, not the questions.

## Note for the dev

The whole app was previously stuck on a loading spinner because Clerk failed to
load from `clerk.probateswift.com` (`failed_to_load_clerk_js`). Reported resolved
on 2026-06-11. Worth a guarded fallback so a future Clerk outage shows a message
rather than an infinite spinner.
