# ProbateSwift — The Offer (v1, smoke-test)

Goal of this phase: acquisition and proof of value. Get people in via a free assessment, prove
they'd pay for the happy-path journey, learn the price ceiling. Not built yet end-to-end, so this
is a landing-page smoke test promising the full experience with a waitlist/early-access capture.

## The offer in one line

**Find out if you need probate in 5 minutes, free. If you do, we'll guide you through it and fill
your forms. Pay one fixed fee only when you're ready to submit. No solicitor, no percentage.**

## The promise ladder

1. **Free assessment** — "Do you even need probate?" Answer a few questions, get a clear yes/no plus
   what it'll cost you and roughly how long it'll take. No signup wall to get the answer.
2. **Guided happy path** — if you need probate and your estate fits the happy path, ProbateSwift walks
   you through every step: what to gather, who to notify, and the IHT and probate forms, completed from
   what you've entered.
3. **Pay at submission** — one fixed fee, shown upfront, charged only when your forms are ready to send.
   Free to use the whole way until then.

## Who it's for (the happy path)

Aim v1 at the estate that **clearly needs probate but isn't a nightmare**:

In scope:
- Death in England & Wales, valid will, one executor acting.
- One property, a handful of bank/savings/ISA accounts, maybe one investment account.
- IHT400 territory but **straightforward**: no trusts, no business or agricultural relief, no foreign
  assets, no complex lifetime-gift history, no disputes.

Out of scope (triage them out, refer on):
- Intestacy with disputes, multiple executors disagreeing, foreign assets, trusts, business relief,
  contested estates, insolvent estates. The assessment should spot these and say "this one needs a
  professional" — which builds trust and protects you on liability.

This is the point of leading with the assessment: it both acquires the easy cases and **honestly
turns away the hard ones**, which is itself a trust signal.

## Price posture

- **Assessment: free, always.** This is the acquisition wedge. Keep it ungated so it spreads.
- **The fee: charged at submission, fixed, no percentage.** Because the free assessment carries
  acquisition, the price does **not** gate signups, so you can test a confident number without
  hurting top-of-funnel. That is the answer to "leaving money on the table": be generous at the top,
  bold at the point of value.
- **Number to test: lead with £399.** It's a real product price (clearly not DIY), and it's ~70% under
  Octopus's £1,290 solicitor IHT tier, so the savings story is obvious. Worth A/B testing £399 / £499 /
  £599 at the submission step to find the ceiling, since the free assessment protects acquisition either
  way. Provisional per `dec-pricing-model` (benchmark-and-test).

## Why it's sharp

- One clear job: "do I need probate, and if so get it done without a solicitor."
- One clear price model: free to start, one fixed fee, no percentage.
- One clear villain: the £1,290+ solicitor bill / the 2–4% bank fee.
- One clear scope: the happy path, with the hard cases honestly sent elsewhere.
