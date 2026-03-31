import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsentBanner from "@/components/legal/CookieConsentBanner";

interface SectionListProps {
  title: string;
  items: string[];
}

export function SectionList({ title, items }: SectionListProps) {
  return (
    <div className="space-y-3">
      {title ? <p className="font-medium text-slate-900">{title}</p> : null}
      <ul className="list-disc space-y-2 pl-5 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

interface LegalPageLayoutProps {
  title: string;
  description: string;
  effectiveDate: string;
  children: ReactNode;
}

export default function LegalPageLayout({
  title,
  description,
  effectiveDate,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="mb-10 space-y-4 border-b border-slate-200 pb-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-700">
              Legal information
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
            <p className="text-sm text-slate-500">Effective date: {effectiveDate}</p>
          </div>
          <div className="space-y-10 text-base leading-7">{children}</div>
        </div>
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  );
}
