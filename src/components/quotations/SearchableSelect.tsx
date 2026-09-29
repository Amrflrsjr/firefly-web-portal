import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

export type SelectId = string | number;

export interface SelectOption {
  id: SelectId;
  label: string;
  /** Secondary line under the label (e.g. SKU, variant count) */
  description?: string;
  /** Right-aligned text (e.g. price) */
  meta?: string;
  /** Text matched by the search box. Defaults to `label`. */
  searchText?: string;
}

export interface SelectFooterAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface SearchableSelectProps {
  /** Controlled open state so the parent can chain dropdowns (product -> variant). */
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Called with the option id, or `null` when the "none" option is picked.
   *  The parent is responsible for closing the dropdown. */
  onSelect: (id: SelectId | null) => void;
  options: SelectOption[];
  selectedId: SelectId | null;
  valueLabel: string;
  placeholder: string;
  noneLabel: string;
  searchPlaceholder: string;
  emptyText: string;
  ariaLabel: string;
  disabled?: boolean;
  footerAction?: SelectFooterAction;
  /** Optional: notified as the user types in the search box. */
  onSearchChange?: (query: string) => void;
  /** Show the "none" row at the top. Set to false for required fields. Default: true. */
  allowNone?: boolean;
}

interface PanelPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

const VIEWPORT_MARGIN = 8;
const MIN_PANEL_WIDTH = 288;
const MAX_PANEL_HEIGHT = 384;

interface DropdownPanelProps {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  options: SelectOption[];
  selectedId: SelectId | null;
  noneLabel: string;
  searchPlaceholder: string;
  emptyText: string;
  ariaLabel: string;
  footerAction?: SelectFooterAction;
  onSearchChange?: (query: string) => void;
  allowNone: boolean;
  onSelect: (id: SelectId | null) => void;
  onClose: () => void;
}

const DropdownPanel: React.FC<DropdownPanelProps> = ({
  triggerRef,
  options,
  selectedId,
  noneLabel,
  searchPlaceholder,
  emptyText,
  ariaLabel,
  footerAction,
  onSearchChange,
  allowNone,
  onSelect,
  onClose,
}) => {
  const listId = useId();
  const optionId = (index: number) => `${listId}-option-${index}`;
  // Row 0 is the "none" option when allowed; real options follow it
  const noneCount = allowNone ? 1 : 0;

  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(() => {
    if (selectedId === null) return 0;
    const i = options.findIndex((o) => o.id === selectedId);
    return i >= 0 ? i + noneCount : 0;
  });
  const [pos, setPos] = useState<PanelPosition | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the latest onClose without re-running the effects below on every render
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      (o.searchText ?? o.label).toLowerCase().includes(q),
    );
  }, [options, query]);

  const totalOptions = results.length + noneCount;
  const activeIndex = Math.min(highlight, Math.max(totalOptions - 1, 0));

  // Position the panel under (or above) the trigger; follow scroll/resize.
  useLayoutEffect(() => {
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const width = Math.min(
        Math.max(r.width, MIN_PANEL_WIDTH),
        vw - VIEWPORT_MARGIN * 2,
      );
      const left = Math.min(
        Math.max(r.left, VIEWPORT_MARGIN),
        vw - width - VIEWPORT_MARGIN,
      );

      const spaceBelow = vh - r.bottom - VIEWPORT_MARGIN;
      const spaceAbove = r.top - VIEWPORT_MARGIN;
      const openUp = spaceBelow < 260 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(
        MAX_PANEL_HEIGHT,
        Math.max(160, (openUp ? spaceAbove : spaceBelow) - 4),
      );

      setPos(
        openUp
          ? { left, width, maxHeight, bottom: vh - r.top + 4 }
          : { left, width, maxHeight, top: r.bottom + 4 },
      );
    };

    const onScroll = (e: Event) => {
      // Scrolling the option list itself shouldn't reposition the panel
      if (panelRef.current?.contains(e.target as Node)) return;
      update();
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [triggerRef]);

  // Focus the search box on open + close on outside click
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    listRef.current?.children[highlight]?.scrollIntoView({ block: "nearest" });

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      onCloseRef.current();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerRef]);

  const moveHighlight = (next: number) => {
    setHighlight(next);
    listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
  };

  const choose = (id: SelectId | null) => {
    onSelect(id);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveHighlight(Math.min(activeIndex + 1, totalOptions - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        moveHighlight(Math.max(activeIndex - 1, 0));
        break;
      case "Enter": {
        e.preventDefault();
        if (allowNone && activeIndex === 0) {
          // Typed a search that matched nothing: don't clear the selection
          if (query.trim() && results.length === 0) return;
          choose(null);
        } else {
          const option = results[activeIndex - noneCount];
          if (option) choose(option.id);
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        onClose();
        triggerRef.current?.focus();
        break;
      case "Tab":
        onClose();
        break;
    }
  };

  const rowClass = (index: number) =>
    `flex min-h-10 cursor-pointer items-center justify-between gap-3 px-3 py-2 ${
      index === activeIndex
        ? "bg-slate-100 dark:bg-slate-800"
        : "bg-white dark:bg-slate-900"
    }`;

  return createPortal(
    <div
      ref={panelRef}
      style={
        pos
          ? {
              position: "fixed",
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              top: pos.top,
              bottom: pos.bottom,
            }
          : { position: "fixed", top: 0, left: 0, opacity: 0 }
      }
      className="z-70 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative shrink-0 border-b border-slate-100 p-2 dark:border-slate-800">
        <Search className="pointer-events-none absolute left-4.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={
            totalOptions > 0 ? optionId(activeIndex) : undefined
          }
          autoComplete="off"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearchChange?.(e.target.value);
            // While searching, Enter should pick the first match, not "none"
            setHighlight(e.target.value.trim() ? noneCount : 0);
          }}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-800 shadow-2xs transition-all focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={ariaLabel}
        className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto overscroll-contain dark:divide-slate-800"
      >
        {allowNone && (
          <li
            id={optionId(0)}
            role="option"
            aria-selected={selectedId === null}
            onMouseEnter={() => setHighlight(0)}
            onClick={() => choose(null)}
            className={rowClass(0)}
          >
            <p className="text-xs font-semibold italic text-slate-500 dark:text-slate-400">
              {noneLabel}
            </p>
            {selectedId === null && (
              <Check
                className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-label="Currently selected"
              />
            )}
          </li>
        )}

        {results.map((option, i) => {
          const index = i + noneCount;
          const isSelected = selectedId === option.id;
          return (
            <li
              key={option.id}
              id={optionId(index)}
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => choose(option.id)}
              className={rowClass(index)}
            >
              <div className="min-w-0">
                <p className="wrap-break-word text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {option.label}
                </p>
                {option.description && (
                  <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {option.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                {option.meta && (
                  <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                    {option.meta}
                  </span>
                )}
                {isSelected && (
                  <Check
                    className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                    aria-label="Currently selected"
                  />
                )}
              </div>
            </li>
          );
        })}

        {results.length === 0 && (
          <li
            role="presentation"
            className="px-3 py-3 text-center text-xs font-medium text-slate-400 dark:text-slate-500"
          >
            {emptyText}
          </li>
        )}
      </ul>

      {footerAction && (
        <button
          type="button"
          onClick={footerAction.onClick}
          className="flex min-h-10 w-full shrink-0 cursor-pointer items-center gap-2 border-t border-slate-200 bg-amber-50/60 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 dark:border-slate-800 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40"
        >
          {footerAction.icon}
          {footerAction.label}
        </button>
      )}
    </div>,
    document.body,
  );
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  open,
  onOpen,
  onClose,
  onSelect,
  options,
  selectedId,
  valueLabel,
  placeholder,
  noneLabel,
  searchPlaceholder,
  emptyText,
  ariaLabel,
  disabled = false,
  footerAction,
  onSearchChange,
  allowNone = true,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={valueLabel || undefined}
        onClick={() => (open ? onClose() : onOpen())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open && !disabled) {
            e.preventDefault();
            onOpen();
          }
        }}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-left text-xs shadow-2xs transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 ${
          open
            ? "border-slate-400 dark:border-slate-500"
            : "border-slate-200 focus:border-slate-400 dark:border-slate-700"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            valueLabel
              ? "text-slate-800 dark:text-slate-100"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {valueLabel || placeholder}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <DropdownPanel
          triggerRef={triggerRef}
          options={options}
          selectedId={selectedId}
          noneLabel={noneLabel}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          ariaLabel={ariaLabel}
          footerAction={footerAction}
          onSearchChange={onSearchChange}
          allowNone={allowNone}
          onSelect={onSelect}
          onClose={onClose}
        />
      )}
    </>
  );
};
