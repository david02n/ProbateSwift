import LegalPageLayout, { SectionList } from "@/components/legal/LegalPageLayout";

const EFFECTIVE_DATE = "31 March 2026";

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="This Cookie Policy explains how 02n Ltd uses cookies and similar technologies on the ProbateSwift website, application, and related services."
      effectiveDate={EFFECTIVE_DATE}
    >
      <section className="space-y-4">
        <p>
          This Cookie Policy explains how 02n Ltd ("ProbateSwift", "we", "us", or
          "our") uses cookies and similar technologies on the ProbateSwift website,
          application, and related services.
        </p>
        <p>This policy should be read alongside our Privacy Policy.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">1. What are cookies?</h2>
        <p>
          Cookies are small text files placed on your device when you visit a website or
          use an app. They help websites and apps function, remember information about
          your visit, and collect information about how people use a service.
        </p>
        <p>
          We may also use similar technologies such as local storage, session storage,
          pixels, tags, and SDK-based identifiers. For simplicity, this policy refers to
          all of these technologies as "cookies".
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">2. Why we use cookies</h2>
        <SectionList
          title="We use cookies to:"
          items={[
            "make the Service work properly;",
            "keep users signed in and secure;",
            "remember preferences and settings;",
            "understand how visitors and users interact with ProbateSwift;",
            "improve performance, functionality, and usability; and",
            "measure product and website usage.",
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">3. The types of cookies we use</h2>
        <div className="space-y-4">
          <p className="font-medium text-slate-900">Strictly necessary cookies</p>
          <p>
            These cookies are required for the Service to function properly. They may be
            used for core functions such as login, authentication, security, session
            management, network management, and user-requested features.
          </p>
          <SectionList
            title="Examples may include cookies or storage used to:"
            items={[
              "keep you logged in;",
              "maintain your authenticated session;",
              "prevent fraud and abuse;",
              "remember privacy choices or cookie consent preferences; and",
              "support core site security.",
            ]}
          />
        </div>
        <div className="space-y-4">
          <p className="font-medium text-slate-900">Analytics and performance cookies</p>
          <p>
            These cookies help us understand how the Service is used, such as which pages
            are visited, which features are used, how users move through the site, and
            whether errors occur.
          </p>
          <SectionList
            title="We currently use tools including:"
            items={["Google Analytics", "PostHog"]}
          />
          <p>
            Where required by law, we only set analytics cookies after you have given consent.
          </p>
        </div>
        <div className="space-y-4">
          <p className="font-medium text-slate-900">Functionality cookies</p>
          <p>
            These cookies remember choices you make and help personalise aspects of the
            Service, such as settings, consent preferences, or interface behaviour.
          </p>
        </div>
        <div className="space-y-4">
          <p className="font-medium text-slate-900">Third-party cookies</p>
          <p>
            Some cookies may be set by third-party providers whose services we use, for
            example for analytics or authentication support.
          </p>
          <SectionList
            title="Third-party services we may use include:"
            items={["Google Analytics", "Google Authentication", "PostHog"]}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">4. Cookies we may use</h2>
        <p>
          The exact cookies may change over time as we develop the Service and change
          providers. The table below describes the categories of cookies we currently
          expect to use.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-900">Cookie / Technology</th>
                <th className="px-4 py-3 font-medium text-slate-900">Provider</th>
                <th className="px-4 py-3 font-medium text-slate-900">Purpose</th>
                <th className="px-4 py-3 font-medium text-slate-900">Type</th>
                <th className="px-4 py-3 font-medium text-slate-900">Typical Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              <tr>
                <td className="px-4 py-3">Authentication/session cookies</td>
                <td className="px-4 py-3">ProbateSwift / Google</td>
                <td className="px-4 py-3">Keeps users signed in and supports secure login flows</td>
                <td className="px-4 py-3">Strictly necessary</td>
                <td className="px-4 py-3">Session or short-lived</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Consent preference cookie</td>
                <td className="px-4 py-3">ProbateSwift</td>
                <td className="px-4 py-3">Stores your cookie choices</td>
                <td className="px-4 py-3">Strictly necessary</td>
                <td className="px-4 py-3">Up to 12 months</td>
              </tr>
              <tr>
                <td className="px-4 py-3">_ga and related analytics cookies</td>
                <td className="px-4 py-3">Google Analytics</td>
                <td className="px-4 py-3">Distinguishes users and helps generate usage statistics</td>
                <td className="px-4 py-3">Analytics</td>
                <td className="px-4 py-3">Up to 2 years</td>
              </tr>
              <tr>
                <td className="px-4 py-3">PostHog cookies or browser storage identifiers</td>
                <td className="px-4 py-3">PostHog</td>
                <td className="px-4 py-3">Product analytics, usage measurement, feature analysis</td>
                <td className="px-4 py-3">Analytics</td>
                <td className="px-4 py-3">Varies by configuration</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Security-related cookies</td>
                <td className="px-4 py-3">ProbateSwift / infrastructure providers</td>
                <td className="px-4 py-3">Helps protect the Service and prevent abuse</td>
                <td className="px-4 py-3">Strictly necessary</td>
                <td className="px-4 py-3">Session or short-lived</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Important: you should update this table to reflect the actual cookies and storage
          keys in use on your site, especially once your banner and analytics setup are live.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">5. Consent</h2>
        <p>Where required by law, we will ask for your consent before using non-essential cookies and similar technologies.</p>
        <SectionList
          title="This means:"
          items={[
            "strictly necessary cookies may be set without consent where they are needed for the Service to work;",
            "analytics, performance, and similar non-essential cookies should not be set until you accept them, unless a lawful exception clearly applies; and",
            "you should be able to reject non-essential cookies as easily as you accept them.",
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">6. Google Analytics</h2>
        <p>
          We use Google Analytics to understand how visitors use ProbateSwift, such as
          which pages are visited, how users navigate the site, and how the Service performs.
        </p>
        <p>
          Google says that when you use Google Analytics, you must disclose its use and
          how it collects and processes data. Google also explains that Google Analytics
          uses cookies and similar identifiers to measure user interactions.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">7. PostHog</h2>
        <p>
          We use PostHog for product analytics and to understand how users interact with
          features inside ProbateSwift.
        </p>
        <p>
          Depending on configuration, PostHog may use cookies, local storage, session
          storage, or cookieless approaches.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">8. Google Authentication</h2>
        <p>
          If you sign in using Google Authentication, cookies or similar technologies may
          be used as part of the sign-in, session, and security process.
        </p>
        <p>
          These technologies are generally used to support authentication, account
          access, and fraud prevention.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">9. How to manage cookies</h2>
        <p>You can manage your cookie preferences through our cookie banner or cookie settings tool.</p>
        <p>
          You can also control cookies through your browser settings, including by
          blocking or deleting cookies. Please note that disabling strictly necessary
          cookies may stop parts of the Service from working properly.
        </p>
        <p>
          If you previously accepted analytics or other non-essential cookies, you can
          later withdraw that choice through our cookie settings tool.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">10. Changes to this Cookie Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes to the
          law, our providers, or the way the Service uses cookies and similar technologies.
        </p>
        <p>When we do, we will update the effective date at the top of this page.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">11. Contact</h2>
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
