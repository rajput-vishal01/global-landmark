"use client";

import { EASE } from "@/lib/motion";
import { useCallback, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useOutsideClick } from "@/lib/hooks";
import { cardChrome } from "@/components/admin/desk";
import { deskFieldFull } from "./FormSection";

/**
 * Free-text project field with suggestions from existing projects — never a
 * hard constraint. Typing a new name creates the project on save.
 */
export function ProjectSuggestInput({
  suggestions,
  defaultValue = "",
  id,
  onValueChange,
}: {
  suggestions: string[];
  defaultValue?: string;
  id?: string;
  /** Every change, typed or picked — the property form uses it to fill in the project’s details. */
  onValueChange?: (value: string) => void;
}) {
  const [value, setValueState] = useState(defaultValue);
  function setValue(next: string) {
    setValueState(next);
    onValueChange?.(next);
  }
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const matches = suggestions.filter(
    (name) =>
      name.toLowerCase().includes(value.trim().toLowerCase()) &&
      name.toLowerCase() !== value.trim().toLowerCase()
  );

  useOutsideClick(
    rootRef,
    useCallback(() => setIsOpen(false), [])
  );

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
        className={deskFieldFull}
      />
      <AnimatePresence>
        {isOpen && matches.length > 0 && (
          <m.ul
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25, ease: EASE }}
           
            className={`absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto ${cardChrome}`}
          >
            {matches.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    setValue(name);
                    setIsOpen(false);
                  }}
                  className="w-full cursor-pointer px-4 py-2.5 text-left text-[13px] text-ink transition-colors duration-150 hover:bg-raise"
                >
                  {name}
                </button>
              </li>
            ))}
          </m.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
