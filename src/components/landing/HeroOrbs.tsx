"use client";

export function HeroOrbs() {
  const orb =
    "w-full h-full rounded-full blur-[80px] opacity-30 animate-float pointer-events-none";

  return (
    <>
      <div
        className="absolute w-125 h-125 top-[10%] -right-[10%] pointer-events-none -z-10"
        aria-hidden="true"
      >
        <div
          className={`${orb} bg-[linear-gradient(135deg,rgba(14,124,155,1),rgba(0,78,137,1))]`}
        />
      </div>
      <div
        className="absolute w-100 h-100 bottom-[20%] -left-[5%] pointer-events-none -z-10"
        aria-hidden="true"
      >
        <div
          className={`${orb} bg-[linear-gradient(135deg,#f59e0b,rgba(245,158,11,0.7))]`}
          style={{ animationDelay: "7s" }}
        />
      </div>
      <div
        className="absolute w-87.5 h-87.5 top-1/2 left-1/2 pointer-events-none -z-10"
        aria-hidden="true"
      >
        <div
          className={`${orb} bg-[linear-gradient(135deg,rgba(0,78,137,1),rgba(14,124,155,1))]`}
          style={{ animationDelay: "14s" }}
        />
      </div>
    </>
  );
}
