import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, PackagePlus, Search, X } from "lucide-react";
import type { Product } from "../../types/product";

interface ProductPickerModalProps {
  products: Product[];
  selectedProductId?: number | null;
  lineNumber: number;
  onSelect: (product: Product | null) => void;
  onAddNew: () => void;
  onClose: () => void;
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  products,
  selectedProductId = null,
  lineNumber,
  onSelect,
  onAddNew,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive === true),
    [products],
  );
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [activeProducts, query]);

  const totalOptions = results.length + 1; // +1 for the "None" option
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

  const optionId = (index: number) => `product-picker-option-${index}`;

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
        aria-labelledby="product-picker-title"
        className="flex max-h-[85dvh] w-full sm:max-w-md flex-col overflow-hidden rounded-t-2xl sm:rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 sm:slide-in-from-bottom-2 slide-in-from-bottom-full duration-250 ease-out"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0">
            <h3
              id="product-picker-title"
              className="text-sm font-bold text-slate-900 dark:text-white truncate"
            >
              Select product
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
              aria-controls="product-picker-list"
              aria-activedescendant={optionId(activeIndex)}
              autoComplete="off"
              placeholder="Search products by name..."
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
              {query.trim()
                ? `${results.length} of ${activeProducts.length} products`
                : `${activeProducts.length} ${activeProducts.length === 1 ? "product" : "products"}`}
            </span>
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
            >
              <PackagePlus className="h-3.5 w-3.5" />
              Add new product
            </button>
          </div>
        </div>

        <div className="min-h-40 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          <ul
            ref={listRef}
            id="product-picker-list"
            role="listbox"
            className="divide-y divide-slate-100 dark:divide-slate-800"
          >
            {/* None / Custom Item Option */}
            <li
              id={optionId(0)}
              role="option"
              aria-selected={selectedProductId === null}
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
                  — None (Custom Item) —
                </p>
              </div>
              {selectedProductId === null && (
                <Check
                  className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-label="Currently selected"
                />
              )}
            </li>

            {results.map((p, i) => {
              const optionIndex = i + 1;
              const isSelected =
                selectedProductId !== null && p.productId === selectedProductId;
              const variantCount = p.variants?.length ?? 0;
              const showDescription =
                !!p.description && p.description.trim() !== p.name.trim();

              return (
                <li
                  key={p.productId ?? p.name}
                  id={optionId(optionIndex)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(optionIndex)}
                  onClick={() => onSelect(p)}
                  className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2.5 ${
                    optionIndex === activeIndex
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="wrap-break-word text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {p.name}
                    </p>
                    {(showDescription || variantCount > 0) && (
                      <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {showDescription ? p.description : ""}
                        {showDescription && variantCount > 0 ? "  |  " : ""}
                        {variantCount > 0
                          ? `${variantCount} ${variantCount === 1 ? "variant" : "variants"}`
                          : ""}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check
                      className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-label="Currently selected"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
