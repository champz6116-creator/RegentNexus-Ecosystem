export default function Watermark() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 select-none opacity-[0.03] dark:opacity-[0.05] flex items-center justify-center overflow-hidden">
      <div className="text-[25vw] font-black text-slate-900 dark:text-emerald-400 font-sans tracking-tighter transform -rotate-12 select-none">
        REGENT
      </div>
    </div>
  );
}