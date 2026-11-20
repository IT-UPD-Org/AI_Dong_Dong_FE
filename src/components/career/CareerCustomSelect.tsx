import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Lock, Check } from "lucide-react";

export interface CareerSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CareerCustomSelectProps {
  id?: string;
  label?: string;
  required?: boolean;
  value: string;
  options: CareerSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
}

export function CareerCustomSelect({
  id,
  label,
  required,
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
  className = "",
}: CareerCustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden native select for form validation, accessibility, and automated test runners */}
      <select
        id={id}
        aria-label={label || placeholder}
        required={required}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only pointer-events-none"
        tabIndex={-1}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}{opt.disabled ? " (Chưa mở)" : ""}
          </option>
        ))}
      </select>

      {/* Custom styled trigger button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          flex w-full items-center justify-between gap-2
          rounded-xl border px-3 py-2 text-xs font-medium
          transition-all duration-200 outline-none
          ${
            disabled
              ? "cursor-not-allowed opacity-50 bg-muted/40 border-border text-muted-foreground"
              : "cursor-pointer bg-field text-foreground hover:bg-hover/40"
          }
          ${isOpen ? "border-brand ring-2 ring-brand/20 shadow-xs" : "border-input"}
        `}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
          {selectedOption ? (
            <span className="truncate font-medium">{selectedOption.label}</span>
          ) : (
            <span className="truncate text-muted-foreground">
              {placeholder || "Chọn mục..."}
            </span>
          )}
        </div>

        <ChevronDown
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180 text-brand-text" : ""
          }`}
        />
      </button>

      {/* Custom Dropdown list strictly bounded inside container width */}
      {isOpen && !disabled && (
        <div
          role="listbox"
          className="
            absolute top-full left-0 right-0 z-50 mt-1.5
            w-full max-h-56 overflow-y-auto
            rounded-xl border border-border bg-elevated/95 backdrop-blur-md p-1
            shadow-xl text-foreground animate-in fade-in-0 zoom-in-95 duration-150
            [scrollbar-width:thin]
          "
        >
          <div className="flex flex-col gap-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const isOptDisabled = !!opt.disabled;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isOptDisabled}
                  title={opt.label}
                  onClick={() => {
                    if (isOptDisabled) return;
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`
                    group relative flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors select-none
                    ${
                      isOptDisabled
                        ? "cursor-not-allowed opacity-60 bg-muted/20 text-muted-foreground"
                        : isSelected
                          ? "bg-brand-soft font-semibold text-brand-text cursor-pointer"
                          : "cursor-pointer text-foreground hover:bg-brand-soft/60 hover:text-brand-text"
                    }
                  `}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="truncate">{opt.label}</span>
                  </div>

                  {isOptDisabled ? (
                    <div className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-normal">
                      <Lock size={11} className="text-muted-foreground/80" />
                      <span>Chưa mở</span>
                    </div>
                  ) : isSelected ? (
                    <Check size={14} className="shrink-0 text-brand-text font-bold" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
