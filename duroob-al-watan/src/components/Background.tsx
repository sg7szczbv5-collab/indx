/** خلفية مؤسسية: شبكة دقيقة + توهج لوني + طريق متحرك */
export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-navy" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-saudi/25 blur-[120px]" />
      <div className="absolute -bottom-48 -left-32 h-[30rem] w-[30rem] rounded-full bg-sand/20 blur-[130px]" />
      <svg className="absolute bottom-16 left-0 h-40 w-full opacity-30" viewBox="0 0 1440 160" preserveAspectRatio="none">
        <path d="M0 140 C 360 140 480 40 760 60 S 1200 120 1440 30" fill="none" stroke="#1E293B" strokeWidth="26" />
        <path
          className="road-dash"
          d="M0 140 C 360 140 480 40 760 60 S 1200 120 1440 30"
          fill="none"
          stroke="#D97706"
          strokeWidth="2"
          strokeDasharray="20 20"
        />
      </svg>
    </div>
  );
}
