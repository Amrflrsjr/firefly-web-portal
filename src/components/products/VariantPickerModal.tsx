import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import type { ProductVariant } from "../../types/product";

interface VariantPickerModalProps {
  variants: ProductVariant[];
  selectedVariantId?: number | null;
  productName: string;
  lineNumber: number;
  onSelect: (variant: ProductVariant | null) => void;
  onAddNewVariant: () => void;
  onClose: () => void;
}

const currency = (value: number) =>
  `₱${(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const VariantPickerModal: React.FC<VariantPickerModalProps> = ({
  variants,
  selectedVariantId = null,
  productName,
  lineNumber,
  onSelect,
  onAddNewVariant,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const formatVariantLabel = (color?: string, size?: string) => {
    const parts = [color, size].filter((p) => p && p.trim() !== "");
    return parts.length > 0 ? parts.join(" / ") : "";
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return variants.filter((v) => {
      const label = formatVariantLabel(v.color, v.size).toLowerCase();
      const sku = (v.sku || "").toLowerCase();
      return label.includes(q) || sku.includes(q);
    });
  }, [variants, query]);

  const totalOptions = results.length + 1;
  const activeIndex = Math.min(highlight, Math.max(totalOptions - 1, 0));

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const moveHighlight = (next: number) => {
    setHighlight(next);
    listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(Math.min(activeIndex + 1, totalOptions - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(Math.max(activeIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex === 0) {
        onSelect(null);
      } else if (results[activeIndex - 1]) {
        onSelect(results[activeIndex - 1]);
      }
    }
  };

  const optionId = (index: number) => `variant-picker-option-${index}`;

  return (
    <div
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center overscroll-contain bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-picker-title"
        className="flex max-h-[85dvh] w-full sm:max-w-md flex-col overflow-hidden rounded-t-2xl sm:rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 sm:slide-in-from-bottom-2 slide-in-from-bottom-full duration-250 ease-out"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0">
            <h3
              id="variant-picker-title"
              className="text-sm font-bold text-slate-900 dark:text-white truncate"
            >
              Select variant ({productName})
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Line item {lineNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="shrink-0 space-y-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls="variant-picker-list"
              aria-activedescendant={optionId(activeIndex)}
              autoComplete="off"
              placeholder="Search variants by name or SKU..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-800 shadow-2xs transition-all focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {variants.length} {variants.length === 1 ? "variant" : "variants"}{" "}
              available
            </span>
            <button
              type="button"
              onClick={onAddNewVariant}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
            >
              <Plus className="h-3.5 w-3.5" />
              Add new variant
            </button>
          </div>
        </div>

        <div className="min-h-40 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          <ul
            ref={listRef}
            id="variant-picker-list"
            role="listbox"
            className="divide-y divide-slate-100 dark:divide-slate-800"
          >
            <li
              id={optionId(0)}
              role="option"
              aria-selected={selectedVariantId === null}
              onMouseEnter={() => setHighlight(0)}
              onClick={() => onSelect(null)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2.5 ${
                0 === activeIndex
                  ? "bg-slate-100 dark:bg-slate-800"
                  : "bg-white dark:bg-slate-900"
              }`}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold italic text-slate-500 dark:text-slate-400">
                  — None / Standard Item —
                </p>
              </div>
              {selectedVariantId === null && (
                <Check
                  className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-label="Currently selected"
                />
              )}
            </li>

            {results.map((v, i) => {
              const optionIndex = i + 1;
              const isSelected = selectedVariantId === v.productVariantId;
              const vLabel = formatVariantLabel(v.color, v.size);
              const skuLabel = v.sku ? `SKU: ${v.sku}` : "";

              return (
                <li
                  key={v.productVariantId ?? i}
                  id={optionId(optionIndex)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(optionIndex)}
                  onClick={() => onSelect(v)}
                  className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2.5 ${
                    optionIndex === activeIndex
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {vLabel || "Standard Variant"}
                    </p>
                    {skuLabel && (
                      <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                        {skuLabel}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                      {currency(v.unitPrice)}
                    </span>
                    {isSelected && (
                      <Check
                        className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                        aria-label="Currently selected"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
