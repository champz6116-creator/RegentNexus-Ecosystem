import { useNavigate } from 'react-router-dom';

export default function FAB() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/listings/new')}
      className="fixed bottom-20 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-slate-900 dark:bg-emerald-500 text-white shadow-lg hover:bg-slate-700 dark:hover:bg-emerald-600 transition hover:scale-110 sm:bottom-6 animate-fade-in"
      title="Create a new listing"
    >
      <span className="text-3xl font-light">+</span>
    </button>
  );
}
