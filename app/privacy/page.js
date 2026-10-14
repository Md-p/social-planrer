import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Blogbio Social Planner',
  description: 'Privacy Policy and Data Protection Information for Blogbio Social Planner.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Back to Social Planner
        </Link>

        <h1 className="text-3xl font-black text-[#043873] mb-4">Privacy Policy</h1>
        <p className="text-xs text-slate-400 mb-8">Last Updated: October 14, 2026</p>

        <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">1. Overview</h2>
            <p>
              Blogbio Social Planner (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;) provides social media management and scheduling tools for Facebook Pages. We respect your privacy and are committed to protecting the data of our users.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">2. Information We Collect</h2>
            <p>
              When you use our application to schedule and publish content, we collect only the necessary credentials and information required to provide the service:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>Facebook Page IDs, Page Names, and Page Access Tokens provided by you or via Facebook OAuth.</li>
              <li>Scheduled post content (captions, images, video links, scheduled publishing timestamps).</li>
              <li>Telegram Bot tokens and Chat IDs (optional, used solely for sending publication notifications).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">3. How We Use Your Data</h2>
            <p>
              Your data is used exclusively to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>Publish approved posts, photos, and video reels to your selected Facebook Pages at your scheduled times.</li>
              <li>Display Page analytics, follower counts, and post status to you within your dashboard.</li>
              <li>Send you instant alerts when posts are published or if an upload error occurs.</li>
            </ul>
            <p className="mt-2">
              We <b>never sell, rent, or share</b> your personal data or Facebook access tokens with third parties or advertising networks.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">4. Data Storage and Security</h2>
            <p>
              Access tokens and post schedules are stored securely in your private application instance. Media files uploaded to our server are automatically removed following publication.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">5. User Data Deletion</h2>
            <p>
              You can disconnect your Facebook Page or delete all stored data at any time from your settings panel. To request complete deletion of any stored data associated with your Facebook user account, visit our{' '}
              <Link href="/data-deletion" className="text-blue-600 underline font-medium">
                User Data Deletion page
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">6. Contact Information</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy, please contact us at support@blogbio.org or through the application settings.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
