export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* Background Dim Backdrop Dismissal Trigger */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-6 shadow-xl border border-transparent dark:border-slate-700 z-10">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          title="Close window"
        >
          ✕
        </button>
        {title && <h2 className="text-2xl font-bold text-slate-900 dark:text-white pr-8 tracking-tight">{title}</h2>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
