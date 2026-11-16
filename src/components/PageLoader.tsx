import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PROFILE } from '../data/portfolioData';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export function PageLoader() {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState<boolean>(() => !reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 1150);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#07050d]"
          aria-hidden="true"
        >
          <div className="relative flex items-center justify-center">
            <div
              className="absolute h-28 w-28 rounded-full blur-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(212,175,55,0.12) 60%, transparent 100%)',
              }}
            />
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-violet-400/35 bg-[#0b0814] p-2 shadow-[0_0_40px_rgba(139,92,246,0.3)]">
              <img
                src={PROFILE.assets.logo}
                alt="TS monogram"
                className="h-full w-full object-contain"
              />
              <div className="animate-gold-sheen pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            </div>
          </div>
          <p className="font-mono-label mt-5 text-[11px] text-white/50">
            {PROFILE.name}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
