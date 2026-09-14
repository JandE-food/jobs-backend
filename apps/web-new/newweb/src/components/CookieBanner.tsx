import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

export function CookieBanner() {
  const [open, setOpen] = useState(true);

  return (
    <AnimatePresence>
      {open ?
      <motion.aside
        aria-label="Cookie notice"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        className="fixed bottom-20 right-4 z-40 w-[320px] rounded-2xl border border-line bg-white p-4 shadow-pop lg:bottom-4">
        
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-extrabold text-ink">Cookies for core platform flows</h2>
            <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Dismiss cookie notice"
            className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-mute transition-colors duration-150 hover:bg-canvas">
            
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">
            We use a small cookie banner now so billing and privacy flows can grow into GDPR-ready consent management
            later.
          </p>
          <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 h-9 w-full rounded-full bg-brand-600 text-sm font-bold text-white transition-colors duration-150 hover:bg-brand-700">
          
            Accept cookies
          </button>
        </motion.aside> :
      null}
    </AnimatePresence>);

}