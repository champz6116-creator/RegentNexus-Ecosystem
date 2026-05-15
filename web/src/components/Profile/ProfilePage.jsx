export default function ProfilePage({ user }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 className="text-2xl font-semibold text-slate-900">Profile</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[
          ['Name', `${user.firstName} ${user.lastName}`],
          ['School ID', user.schoolId],
          ['Email', user.schoolMail],
          ['Phone', user.phone],
          ['Role', user.role],
          ['Verified', user.verified ? 'Yes' : 'No'],
        ].map(([label, value]) => (
          <article key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-2 text-slate-900">{value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
