import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
  Search,
  FileText,
  Receipt,
  User,
  Loader2,
  FolderSearch,
  LayoutDashboard,
} from "lucide-react";
import type {
  GlobalSearchResponseDto,
  SearchItemDto,
} from "../../types/search";

interface ResultSectionProps {
  title: string;
  items?: SearchItemDto[];
  icon: React.ElementType;
  onSelect: (url: string) => void;
}

const ResultSection: React.FC<ResultSectionProps> = ({
  title,
  items,
  icon: Icon,
  onSelect,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="py-2">
      <h3 className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
        {title}
      </h3>
      <ul>
        {items.map((item) => (
          <li
            key={`${item.type}-${item.id}`}
            onClick={() => onSelect(item.url)}
            className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {item.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.subtitle}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Define searchable static application pages with numeric IDs
const STATIC_PAGES: SearchItemDto[] = [
  {
    id: 1,
    type: "page",
    title: "Dashboard",
    subtitle: "Overview and analytics",
    url: "/",
  },
  {
    id: 2,
    type: "page",
    title: "Customers Directory",
    subtitle: "Manage client companies and contacts",
    url: "/customers",
  },
  {
    id: 3,
    type: "page",
    title: "Quotations",
    subtitle: "Manage client proposals and estimates",
    url: "/quotations",
  },
  {
    id: 4,
    type: "page",
    title: "Products & Catalog",
    subtitle: "Manage items, variants, and stock",
    url: "/products",
  },
  {
    id: 5,
    type: "page",
    title: "Invoices & Payments",
    subtitle: "Billing statements and payment records",
    url: "/invoices",
  },
];

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponseDto | null>(null);
  const [filteredPages, setFilteredPages] = useState<SearchItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSearch = async () => {
      if (!query.trim()) {
        setResults(null);
        setFilteredPages([]);
        setIsOpen(false);
        return;
      }

      // Filter static navigation pages locally
      const lowerQuery = query.toLowerCase();
      const matchedPages = STATIC_PAGES.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerQuery) ||
          p.subtitle.toLowerCase().includes(lowerQuery),
      );
      setFilteredPages(matchedPages);

      setLoading(true);
      try {
        const res = await api.get<GlobalSearchResponseDto>(
          `/search?q=${encodeURIComponent(query)}`,
        );
        setResults(res.data);
        setIsOpen(true);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(url);
  };

  const hasApiResults =
    results &&
    (results.customers.length > 0 ||
      results.invoices.length > 0 ||
      results.quotations.length > 0);

  const hasResults = filteredPages.length > 0 || hasApiResults;

  const isEmptyResult =
    results &&
    filteredPages.length === 0 &&
    results.customers.length === 0 &&
    results.invoices.length === 0 &&
    results.quotations.length === 0;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md z-50">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search everywhere..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (hasResults || isEmptyResult) setIsOpen(true);
          }}
          className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F9B53F]"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 animate-spin" />
        )}
      </div>

      {isOpen && query.trim() !== "" && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {hasResults ? (
            <>
              <ResultSection
                title="Navigation Pages"
                items={filteredPages}
                icon={LayoutDashboard}
                onSelect={handleSelect}
              />
              {results && (
                <>
                  <ResultSection
                    title="Customers"
                    items={results.customers}
                    icon={User}
                    onSelect={handleSelect}
                  />
                  <ResultSection
                    title="Invoices"
                    items={results.invoices}
                    icon={Receipt}
                    onSelect={handleSelect}
                  />
                  <ResultSection
                    title="Quotations"
                    items={results.quotations}
                    icon={FileText}
                    onSelect={handleSelect}
                  />
                </>
              )}
            </>
          ) : !loading && isEmptyResult ? (
            <div className="py-8 px-4 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <FolderSearch className="w-8 h-8 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No results found
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                We couldn't find anything matching "{query}"
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
