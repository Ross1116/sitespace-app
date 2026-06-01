import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  animate?: boolean;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  animate = true,
  className,
  children,
  showRadialGradient = true,
  style,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <>
      <div
        className={cn(
          "relative flex h-[100vh] w-full flex-col items-center justify-center overflow-hidden bg-zinc-50 text-slate-950 transition-bg",
          className
        )}
        style={
          {
            "--white": "var(--color-white)",
            "--black": "var(--color-black)",
            "--transparent": "transparent",
            "--blue-500": "var(--color-blue-500)",
            "--indigo-300": "var(--color-indigo-300)",
            "--blue-300": "var(--color-blue-300)",
            "--violet-200": "var(--color-violet-200)",
            "--blue-400": "var(--color-blue-400)",
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            //   I'm sorry but this is what peak developer performance looks like // trigger warning
            className={cn(
              animate && "aurora-motion",
              `
             [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
             [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
             [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]
             [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[6px] invert dark:invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:dark:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:mix-blend-difference
            pointer-events-none
            absolute -inset-[14%] opacity-32 will-change-transform`,

              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
            )}
          ></div>
        </div>
        {children}
      </div>

      <style>{`
        @keyframes aurora {
          from {
            background-position: 50% 50%, 50% 50%;
          }

          to {
            background-position: 150% 50%, 150% 50%;
          }
        }

        @keyframes aurora-drift {
          0% {
            transform: translate3d(-2.5%, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(0.75%, -1%, 0) scale(1.015);
          }

          100% {
            transform: translate3d(3%, 0.5%, 0) scale(1.01);
          }
        }

        @keyframes aurora-drift-reverse {
          0% {
            transform: translate3d(2%, 0.5%, 0) scale(1.01);
          }

          50% {
            transform: translate3d(-0.5%, 1%, 0) scale(1.018);
          }

          100% {
            transform: translate3d(-2.75%, -0.5%, 0) scale(1);
          }
        }

        .aurora-motion {
          animation:
            aurora 60s linear infinite,
            aurora-drift 42s ease-in-out infinite alternate;
        }

        .aurora-motion::after {
          animation:
            aurora 30s linear infinite reverse,
            aurora-drift-reverse 34s ease-in-out infinite alternate;
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora-motion,
          .aurora-motion::after {
            animation: none;
          }
        }

        @media (update: slow) {
          .aurora-motion,
          .aurora-motion::after {
            animation: none;
          }
        }

        :root[data-hero-motion="reduced"] .aurora-motion,
        :root[data-hero-motion="reduced"] .aurora-motion::after {
          animation: none;
        }
      `}</style>
    </>
  );
};
