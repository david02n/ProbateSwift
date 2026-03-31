import LegalPageLayout, { SectionList } from "@/components/legal/LegalPageLayout";

const EFFECTIVE_DATE = "31 March 2026";

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="This Privacy Policy explains how 02n Ltd collects, uses, stores, and shares personal data when you use ProbateSwift."
      effectiveDate={EFFECTIVE_DATE}
    >
      <section className="space-y-4">
        <p>
          This Privacy Policy explains how 02n Ltd ("ProbateSwift", "we", "us", or
          "our") collects, uses, stores, and shares personal data when you use the
          ProbateSwift website, application, and related services.
        </p>
        <p>If you use ProbateSwift, you should read this policy carefully.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">1. Who we are</h2>
        <p>
          Controller: 02n Ltd
          <br />
          Registered address: 167-169 Great Portland Street, London, W1W 5PF
          <br />
          Contact email: support@02n.ltd
        </p>
        <p>
          We are the controller of the personal data described in this Privacy Policy,
          except where another organisation acts as an independent controller for its own
          processing.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">2. What personal data we collect</h2>
        <SectionList
          title="Information you provide directly"
          items={[
            "name",
            "email address",
            "login and account details",
            "information you enter into forms, questionnaires, and workflows",
            "details about the deceased, executors, beneficiaries, family members, and other related persons",
            "estate information, asset information, liability information, property details, tax-related information, and supporting notes",
            "identity and contact information contained in uploaded documents",
            "communications you send to us",
          ]}
        />
        <SectionList
          title="Documents and files you upload"
          items={[
            "identity documents",
            "death certificates",
            "wills and codicils",
            "property documents",
            "financial documents",
            "tax documents",
            "correspondence and other probate-related records",
          ]}
        />
        <SectionList
          title="Technical and usage data"
          items={[
            "device and browser information",
            "IP address",
            "pages viewed and actions taken in the Service",
            "timestamps, log data, and diagnostic data",
            "cookie and similar technology data",
            "analytics and product usage information",
          ]}
        />
        <SectionList
          title="Authentication data"
          items={[
            "name",
            "email address",
            "Google account identifier",
            "profile image, where made available by Google",
          ]}
        />
        <p>
          The exact data shared depends on your Google settings and the permissions
          requested at sign-in.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">3. Sensitive and third-party data</h2>
        <p>
          Probate-related documents can contain information that may be sensitive in
          context, including information about death, family relationships, finances, and,
          in some cases, health or other sensitive matters.
        </p>
        <p>Please only upload documents and information that are necessary for your use of the Service.</p>
        <p>
          If you provide personal data about another person, you are responsible for
          ensuring you have the right to do so.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">4. How we use personal data</h2>
        <SectionList
          title="We use personal data to:"
          items={[
            "create and manage accounts;",
            "provide the Service and its features;",
            "process uploaded documents;",
            "extract, organise, and present information from documents;",
            "generate task lists, guidance, summaries, and draft outputs;",
            "authenticate users;",
            "communicate with users;",
            "monitor performance, security, and reliability;",
            "analyse how the Service is used;",
            "improve the Service;",
            "detect, prevent, and investigate fraud, misuse, and security incidents; and",
            "comply with legal and regulatory obligations.",
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">5. Lawful bases for processing</h2>
        <SectionList
          title="Under applicable UK data protection law, we rely on one or more of the following lawful bases:"
          items={[
            "Contract: where processing is necessary to provide the Service you requested.",
            "Legitimate interests: where processing is necessary for our legitimate interests, such as operating, securing, supporting, and improving the Service, provided your rights do not override those interests.",
            "Legal obligation: where we must process data to comply with law.",
            "Consent: where consent is required, such as for certain analytics or optional cookies.",
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">6. AI processing</h2>
        <p>
          We use AI-supported tools, including OpenAI, to help process user inputs and
          uploaded documents and to generate suggested outputs.
        </p>
        <p>
          This means that information you submit to the Service, including document
          content and typed responses, may be sent to AI providers strictly for the
          purpose of providing the Service.
        </p>
        <p>AI outputs can be inaccurate or incomplete. You should review all outputs carefully before relying on them.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">7. Cookies and analytics</h2>
        <p>We use cookies and similar technologies for:</p>
        <SectionList
          title=""
          items={[
            "essential site functionality;",
            "security and authentication;",
            "analytics and product improvement; and",
            "performance monitoring.",
          ]}
        />
        <SectionList
          title="We may use analytics providers including:"
          items={["Google Analytics", "PostHog"]}
        />
        <p>
          Where required by law, we will ask for your consent before setting
          non-essential cookies or collecting analytics data through cookies or similar technologies.
        </p>
        <p>
          You can manage cookies through our cookie settings tool and, to some extent,
          through your browser settings.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">8. Google Authentication</h2>
        <p>
          If you choose to sign in with Google, Google will authenticate your identity
          and share certain account information with us in line with the permissions you
          approve and Google’s own policies.
        </p>
        <p>
          We use this information only to authenticate you, create or access your
          account, and operate the Service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">9. Who we share personal data with</h2>
        <p>
          We may share personal data with trusted service providers that help us operate
          the Service. These may include:
        </p>
        <SectionList
          title=""
          items={[
            "Railway for hosting and infrastructure-related services",
            "Clerk for authentication",
            "OpenAI for AI processing",
            "PostHog for analytics and product analytics",
            "Google Analytics for website analytics",
            "Google for authentication",
          ]}
        />
        <p>We may also share personal data:</p>
        <SectionList
          title=""
          items={[
            "with professional advisers where necessary;",
            "with law enforcement, regulators, courts, or government bodies where required by law;",
            "in connection with a merger, acquisition, financing, or sale of assets; or",
            "with your consent or at your direction.",
          ]}
        />
        <p>We do not sell your personal data to advertisers.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">10. International transfers</h2>
        <p>
          Some of our service providers may process personal data outside the UK. Where
          this happens, we take steps intended to ensure appropriate protection for
          personal data, such as relying on recognised transfer mechanisms or other lawful
          safeguards where required.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">11. Data retention</h2>
        <p>
          We keep personal data only for as long as reasonably necessary for the purposes
          described in this Privacy Policy, including to provide the Service, maintain
          records, resolve disputes, enforce agreements, and comply with legal obligations.
        </p>
        <SectionList
          title="Unless a longer period is required by law or needed for dispute resolution, we may retain:"
          items={[
            "account data while your account is active and for a reasonable period after closure;",
            "support communications for a reasonable period necessary to manage support history and disputes;",
            "analytics data in line with the retention settings configured in the relevant analytics tools; and",
            "uploaded probate documents until deleted by you, removed by us in line with our retention practices, or no longer needed for the purposes for which they were collected.",
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">12. Security</h2>
        <p>
          We use reasonable technical and organisational measures designed to protect
          personal data against unauthorised access, loss, misuse, alteration, or disclosure.
        </p>
        <p>No system is completely secure, and we cannot guarantee absolute security.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">13. Your rights</h2>
        <p>Depending on your circumstances, you may have the right to:</p>
        <SectionList
          title=""
          items={[
            "request access to your personal data;",
            "request correction of inaccurate data;",
            "request erasure;",
            "request restriction of processing;",
            "object to certain processing;",
            "request portability of data you provided to us; and",
            "withdraw consent where processing relies on consent.",
          ]}
        />
        <p>To exercise these rights, contact us at support@02n.ltd.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">14. Complaints</h2>
        <p>If you have concerns about how we handle personal data, please contact us first.</p>
        <p>You also have the right to complain to the UK Information Commissioner’s Office.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">15. Children</h2>
        <p>ProbateSwift is intended for adults and is not designed for children.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">16. Changes to this Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. If we make material
          changes, we will post the updated version and update the effective date. Where
          appropriate, we may also notify you directly.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">17. Contact</h2>
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
