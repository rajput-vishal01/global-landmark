"use client";

import { EASE } from "@/lib/motion";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Free-text project field with suggestions from existing projects — never a
 * hard constraint. Typing a new name creates the project on save.
 */
export function ProjectSuggestInput({
  suggestions,
  defaultValue = "",
  id,
}: {
  suggestions: string[];
  defaultValue?: string;
  id?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const matches = suggestions.filter(
    (name) =>
      name.toLowerCase().includes(value.trim().toLowerCase()) &&
      name.toLowerCase() !== value.trim().toLowerCase()
  );

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        name="projectName"
        type="text"
        value={value}
        maxLength={200}
        autoComplete="off"
        placeholder="Type a name, or leave empty"
        onChange={(e) => {
          setValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
        className="w-full appearance-none rounded-none border-b border-border bg-transparent py-2.5 font-sans text-body text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
      />
      <AnimatePresence>
        {isOpen && matches.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto border border-border bg-white shadow-[0_18px_44px_-18px_rgba(20,20,20,0.3)]"
          >
            {matches.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    setValue(name);
                    setIsOpen(false);
                  }}
                  className="w-full cursor-pointer px-4 py-2.5 text-left font-sans text-meta text-ink transition-colors duration-150 hover:bg-cream"
                >
                  {name}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
