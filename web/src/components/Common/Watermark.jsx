export default function Watermark() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 opacity-5 dark:opacity-10"
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 200px,
            rgba(16, 185, 129, 0.1) 200px,
            rgba(16, 185, 129, 0.1) 400px
          )
        `,
        backgroundSize: '100% 100%',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
        <div className="text-9xl font-bold text-emerald-200 dark:text-emerald-900 opacity-5 transform -rotate-45">
          R
        </div>
      </div>
    </div>
  );
}
