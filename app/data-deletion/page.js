import Link from 'next/link';

export const metadata = {
  title: 'Data Deletion Instructions — Blogbio Social Planner',
  description: 'How to delete your user data from Blogbio Social Planner according to Facebook Platform Policies.',
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Back to Social Planner
        </Link>

        <h1 className="text-3xl font-black text-[#043873] mb-4">User Data Deletion Instructions</h1>
        <p className="text-xs text-slate-400 mb-8">Facebook Platform Compliance</p>

        <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
          <p>
            Blogbio Social Planner values your privacy. According to Facebook Platform rules, we provide a clear mechanism for users to request the removal and deletion of their data.
          </p>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">How to Delete Your Data</h2>
            <ol className="list-decimal list-inside space-y-2 pl-2">
              <li>
                <b>From Your Facebook Account:</b>
                <ul className="list-disc list-inside mt-1 pl-4 space-y-1 text-xs">
                  <li>Go to your Facebook Profile &gt; <b>Settings &amp; Privacy</b> &gt; <b>Settings</b>.</li>
                  <li>Click on <b>Apps and Websites</b> in the left menu.</li>
                  <li>Find <b>Blogbio Social Planner</b> in the list and click <b>Remove</b>.</li>
                </ul>
              </li>
              <li>
                <b>From the Application:</b>
                <ul className="list-disc list-inside mt-1 pl-4 space-y-1 text-xs">
                  <li>Open your Social Planner Dashboard.</li>
                  <li>Go to <b>Settings</b> and click <b>Disconnect Facebook Account</b>. All access tokens and local cached profile metadata will be instantly cleared.</li>
                </ul>
              </li>
              <li>
                <b>Direct Deletion Request:</b>
                <p className="mt-1 text-xs">
                  If you wish to have all stored post history and configuration permanently purged, please email support@blogbio.org with your Facebook Page ID or User ID. Your request will be processed within 24 hours.
                </p>
              </li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
