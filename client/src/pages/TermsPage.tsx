import LegalPageLayout, { SectionList } from "@/components/legal/LegalPageLayout";

const EFFECTIVE_DATE = "31 March 2026";

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="These Terms govern your access to and use of ProbateSwift, including the website, application, and related services operated by 02n Ltd."
      effectiveDate={EFFECTIVE_DATE}
    >
      <section className="space-y-4">
        <p>
          These Terms of Service govern your access to and use of the ProbateSwift
          website, application, and related services, operated by 02n Ltd
          ("ProbateSwift", "we", "us", or "our").
        </p>
        <p>
          By creating an account, accessing, or using the Service, you agree to these Terms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">1. What ProbateSwift is</h2>
        <p>
          ProbateSwift is a software service designed to help users organise
          information, upload documents, understand administrative steps, and prepare
          for the probate application process in England and Wales.
        </p>
        <p>
          ProbateSwift is an administrative support and workflow tool. It is not a law
          firm, is not regulated legal advice, and does not provide legal, tax,
          financial, or probate advice.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">2. Eligibility</h2>
        <SectionList
          title="You may use the Service only if:"
          items={[
            "you are at least 18 years old;",
            "you have the legal capacity to enter into these Terms; and",
            "you are using the Service for yourself or on behalf of another person with proper authority.",
          ]}
        />
        <p>
          If you use the Service on behalf of an estate, family member, or another person,
          you confirm that you have authority to do so.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">3. No legal or professional advice</h2>
        <SectionList
          title="The Service may provide:"
          items={[
            "checklists;",
            "prompts;",
            "document summaries;",
            "extracted information;",
            "draft answers;",
            "process guidance; and",
            "AI-generated outputs.",
          ]}
        />
        <p>
          These are provided for general information and administrative assistance only.
          They are not legal advice and should not be treated as a substitute for advice
          from a qualified solicitor, probate practitioner, accountant, or tax adviser.
        </p>
        <p>
          You are responsible for checking all information, forms, declarations, and
          supporting documents before submitting anything to HM Courts & Tribunals
          Service, HMRC, the Probate Registry, banks, or any other third party.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">4. AI-generated outputs</h2>
        <p>
          Some features of the Service use artificial intelligence to analyse documents,
          extract information, and generate suggested content.
        </p>
        <SectionList
          title="You agree that:"
          items={[
            "AI outputs are suggestions only;",
            "you will review and verify outputs before relying on them;",
            "you will not rely on the Service as the sole basis for legal, tax, or estate administration decisions; and",
            "we are not responsible for losses caused by your failure to independently verify outputs.",
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">5. Your account</h2>
        <SectionList
          title="You are responsible for:"
          items={[
            "maintaining the confidentiality of your login details;",
            "all activity that occurs under your account; and",
            "providing accurate, current, and complete information.",
          ]}
        />
        <p>
          You must notify us promptly at support@02n.ltd if you believe your account has
          been accessed without permission.
        </p>
        <p>
          We may suspend or terminate accounts where we reasonably believe there has been
          unauthorised access, misuse, fraud, or breach of these Terms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">6. Your content and documents</h2>
        <p>
          You may upload documents, text, information, images, and other materials to the
          Service ("User Content").
        </p>
        <p>
          You retain ownership of your User Content. You grant us a limited licence to
          host, store, process, copy, analyse, and use your User Content as necessary to
          provide the Service, generate outputs you request, maintain security and
          functionality, troubleshoot, support, and improve the Service, and comply with
          legal obligations.
        </p>
        <SectionList
          title="You confirm that:"
          items={[
            "you own or control the rights needed to upload the User Content;",
            "the User Content is accurate to the best of your knowledge;",
            "uploading it does not infringe any third-party rights or break any law; and",
            "you have the right to provide personal data contained in the documents.",
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">7. Acceptable use</h2>
        <SectionList
          title="You must not:"
          items={[
            "use the Service for unlawful, fraudulent, or misleading purposes;",
            "upload malicious code, viruses, or harmful material;",
            "attempt to access other users’ data or interfere with the Service;",
            "reverse engineer, scrape, or copy the Service except where permitted by law;",
            "use the Service to generate or submit false probate, tax, or identity information;",
            "infringe intellectual property, privacy, or confidentiality rights; or",
            "use the Service in any way that could damage, disable, or impair it.",
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">8. Third-party services</h2>
        <p>
          The Service may rely on third-party providers, including hosting,
          authentication, analytics, and AI service providers. Your use of some features
          may therefore involve those third parties processing data on our behalf or, in
          some cases, under their own terms.
        </p>
        <SectionList
          title="Current key providers may include:"
          items={[
            "Railway",
            "Clerk",
            "OpenAI",
            "PostHog",
            "Google Analytics",
            "Google Authentication",
          ]}
        />
        <p>
          We may change providers from time to time. We are not responsible for outages,
          failures, or acts of third-party providers outside our reasonable control,
          although we will take reasonable steps to select and manage providers appropriately.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">9. Intellectual property</h2>
        <p>
          We and our licensors own the Service, including its software, design,
          workflows, branding, and content other than User Content.
        </p>
        <p>
          You may use the Service only as permitted by these Terms. No rights are granted
          to you except the limited right to use the Service for its intended purpose.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">10. Fees and payments</h2>
        <p>Certain features may require payment. Where paid plans or fees apply:</p>
        <SectionList
          title=""
          items={[
            "pricing will be shown before purchase;",
            "fees are payable in advance unless stated otherwise;",
            "except where required by law, payments are non-refundable; and",
            "we may change pricing prospectively by giving reasonable notice.",
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">11. Availability and changes</h2>
        <p>
          We may update, change, suspend, or discontinue any part of the Service at any time.
        </p>
        <p>
          We do not guarantee that the Service will always be available, uninterrupted,
          secure, or error-free. We may carry out maintenance, deploy updates, or remove
          features where necessary.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">12. Disclaimer</h2>
        <p>To the fullest extent permitted by law, the Service is provided on an "as is" and "as available" basis.</p>
        <SectionList
          title="We do not guarantee that:"
          items={[
            "the Service will meet your requirements;",
            "any output will be accurate, complete, or suitable for your circumstances;",
            "any probate application will be accepted;",
            "any estate will qualify for a particular process or exemption; or",
            "use of the Service will avoid delay, rejection, tax liability, or professional fees.",
          ]}
        />
        <p>
          Nothing in these Terms excludes any rights you have under consumer law that
          cannot lawfully be excluded.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">13. Limitation of liability</h2>
        <p>Nothing in these Terms excludes or limits liability for:</p>
        <SectionList
          title=""
          items={[
            "death or personal injury caused by negligence;",
            "fraud or fraudulent misrepresentation; or",
            "any liability that cannot be excluded by law.",
          ]}
        />
        <p>Subject to that, and to the fullest extent permitted by law:</p>
        <SectionList
          title=""
          items={[
            "we are not liable for indirect, incidental, special, consequential, or punitive losses;",
            "we are not liable for loss of profits, business, opportunity, goodwill, or anticipated savings;",
            "we are not liable for loss resulting from inaccurate data, incomplete documents, user error, third-party decisions, court or HMRC action, or reliance on AI-generated content; and",
            "our total aggregate liability arising out of or in connection with the Service shall not exceed the greater of the amount you paid us in the 12 months before the event giving rise to the claim or £100.",
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">14. Consumer rights</h2>
        <p>
          If you are using the Service as a consumer, nothing in these Terms affects your
          mandatory rights under applicable consumer law in England and Wales or the UK.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">15. Suspension and termination</h2>
        <p>We may suspend or terminate your access to the Service if:</p>
        <SectionList
          title=""
          items={[
            "you breach these Terms;",
            "we suspect fraud, abuse, or unlawful activity;",
            "required by law; or",
            "we discontinue the Service.",
          ]}
        />
        <p>You may stop using the Service at any time.</p>
        <p>
          On termination, your right to use the Service ends immediately, but sections
          that by nature should continue will remain in force, including those about
          liability, ownership, disputes, and data handling where relevant.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">16. Privacy</h2>
        <p>
          Your use of the Service is also governed by our Privacy Policy, which explains
          how we collect, use, and share personal data.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">17. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. If we make material changes, we
          will post the updated version and update the effective date. Where appropriate,
          we may also notify users by email or in-app notice.
        </p>
        <p>
          By continuing to use the Service after the updated Terms take effect, you agree
          to the revised Terms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">18. Governing law and jurisdiction</h2>
        <p>These Terms are governed by the laws of England and Wales.</p>
        <p>
          If you are a consumer, you may bring proceedings in the courts available to you
          under applicable law. If you are acting in the course of business, the courts of
          England and Wales shall have exclusive jurisdiction.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">19. Contact</h2>
        <p>
          02n Ltd
          <br />
          167-169 Great Portland Street
          <br />
          London
          <br />
          W1W 5PF
          <br />
          support@02n.ltd
        </p>
      </section>
    </LegalPageLayout>
  );
}
