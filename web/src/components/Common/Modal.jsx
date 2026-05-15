export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
        {title && <h2 className="text-2xl font-semibold text-slate-900 pr-8">{title}</h2>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
