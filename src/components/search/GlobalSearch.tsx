import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Search, FileText, Receipt, User, Loader2 } from "lucide-react";
import type {
  GlobalSearchResponseDto,
  SearchItemDto,
} from "../../types/search";

// 1. Properly type the props for the extracted component
interface ResultSectionProps {
  title: string;
  items?: SearchItemDto[];
  icon: React.ElementType; // Fixes the "any" error
  onSelect: (url: string) => void;
}

// 2. Extract the component OUTSIDE of GlobalSearch
const ResultSection: React.FC<ResultSectionProps> = ({
  title,
  items,
  icon: Icon,
  onSelect,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="py-2">
      <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
        {title}
      </h3>
      <ul>
        {items.map((item) => (
          <li
            key={`${item.type}-${item.id}`}
            onClick={() => onSelect(item.url)}
            className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500">{item.subtitle}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// 3. The main component
export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponseDto | null>(null);
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
        setIsOpen(false);
        return;
      }

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

  const hasResults =
    results &&
    (results.customers.length > 0 ||
      results.invoices.length > 0 ||
      results.quotations.length > 0);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md z-50">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search everywhere..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (hasResults) setIsOpen(true);
          }}
          className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F9B53F]"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {isOpen && hasResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-96 overflow-y-auto">
          {/* Pass the handleSelect function down as a prop */}
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
        </div>
      )}
    </div>
  );
};
