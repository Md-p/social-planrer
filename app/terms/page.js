import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Blogbio Social Planner',
  description: 'Terms of Service for Blogbio Social Planner.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Back to Social Planner
        </Link>

        <h1 className="text-3xl font-black text-[#043873] mb-4">Terms of Service</h1>
        <p className="text-xs text-slate-400 mb-8">Last Updated: October 14, 2026</p>

        <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Blogbio Social Planner, you agree to comply with and be bound by these Terms of Service and all applicable Facebook Platform policies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">2. Permitted Use</h2>
            <p>
              Our application is designed to assist Facebook Page administrators in managing their content scheduling, posting, and analytics. You agree not to use the service to distribute spam, unauthorized advertising, copyright-infringing media, or content that violates Meta Community Standards.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">3. Disclaimers</h2>
            <p>
              The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We are not affiliated with Meta Platforms, Inc. You are solely responsible for compliance with Meta Developer Policies and Community Guidelines.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
