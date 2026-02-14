import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (value: string) => void;
  placeholder?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

type View = 'days' | 'months' | 'years';

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseValue(value: string) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

export default function DatePicker({ value, onChange, placeholder = 'Select date' }: DatePickerProps) {
  const parsed = parseValue(value);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('days');
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const [yearRangeStart, setYearRangeStart] = useState(
    Math.floor((parsed?.year ?? today.getFullYear()) / 12) * 12
  );
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setView('days');
      }
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Sync view when value changes externally
  useEffect(() => {
    const p = parseValue(value);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
      setYearRangeStart(Math.floor(p.year / 12) * 12);
    }
  }, [value]);

  // Reset view when opening
  function toggleOpen() {
    if (!open) setView('days');
    setOpen(!open);
  }

  // --- Navigation per view ---
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function prevYearRange() { setYearRangeStart(yearRangeStart - 12); }
  function nextYearRange() { setYearRangeStart(yearRangeStart + 12); }

  // --- Selections ---
  function selectDay(day: number) {
    onChange(toDateStr(viewYear, viewMonth, day));
    setOpen(false);
    setView('days');
  }

  function selectMonth(month: number) {
    setViewMonth(month);
    setView('days');
  }

  function selectYear(year: number) {
    setViewYear(year);
    setYearRangeStart(Math.floor(year / 12) * 12);
    setView('months');
  }

  // --- Header click: cycle days → months → years ---
  function onHeaderClick() {
    if (view === 'days') setView('months');
    else if (view === 'months') setView('years');
  }

  // --- Build day grid ---
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, current: false });

  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  const isSelected = (day: number) =>
    parsed !== null && viewYear === parsed.year && viewMonth === parsed.month && day === parsed.day;

  // Display value
  const displayText = parsed
    ? `${MONTHS[parsed.month].slice(0, 3)} ${parsed.day}, ${parsed.year}`
    : placeholder;

  // Header label per view
  const headerLabel =
    view === 'days' ? `${MONTHS[viewMonth]} ${viewYear}` :
    view === 'months' ? `${viewYear}` :
    `${yearRangeStart} – ${yearRangeStart + 11}`;

  // Prev/next per view
  const onPrev = view === 'days' ? prevMonth : view === 'months' ? () => setViewYear(viewYear - 1) : prevYearRange;
  const onNext = view === 'days' ? nextMonth : view === 'months' ? () => setViewYear(viewYear + 1) : nextYearRange;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`w-full bg-navy-800 border rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between transition-colors cursor-pointer ${
          open ? 'border-teal-400' : 'border-navy-700 hover:border-navy-600'
        } ${parsed ? 'text-white' : 'text-slate-500'}`}
      >
        <span>{displayText}</span>
        <Calendar size={16} className="text-slate-500" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-navy-900 border border-navy-700 rounded-xl shadow-2xl shadow-black/40 p-4 animate-fade-in">
          {/* Header with nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={onPrev}
              className="p-1.5 rounded-lg hover:bg-navy-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={onHeaderClick}
              className={`text-sm font-semibold transition-colors cursor-pointer px-3 py-1 rounded-lg ${
                view === 'years'
                  ? 'text-white'
                  : 'text-white hover:bg-navy-800 hover:text-teal-400'
              }`}
              disabled={view === 'years'}
            >
              {headerLabel}
            </button>
            <button
              type="button"
              onClick={onNext}
              className="p-1.5 rounded-lg hover:bg-navy-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* === DAYS VIEW === */}
          {view === 'days' && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((cell, i) => {
                  if (!cell.current) {
                    return (
                      <div key={i} className="text-center py-1.5 text-xs text-slate-700">
                        {cell.day}
                      </div>
                    );
                  }
                  const selected = isSelected(cell.day);
                  const todayMark = isToday(cell.day);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectDay(cell.day)}
                      className={`text-center py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                        selected
                          ? 'bg-teal-400 text-navy-950 font-bold'
                          : todayMark
                            ? 'bg-navy-700 text-teal-400 font-semibold'
                            : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* === MONTHS VIEW === */}
          {view === 'months' && (
            <div className="grid grid-cols-3 gap-2">
              {MONTHS_SHORT.map((m, i) => {
                const isCurrent = viewYear === today.getFullYear() && i === today.getMonth();
                const isActive = i === viewMonth;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectMonth(i)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-400 text-navy-950 font-bold'
                        : isCurrent
                          ? 'bg-navy-700 text-teal-400 font-semibold'
                          : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* === YEARS VIEW === */}
          {view === 'years' && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => {
                const yr = yearRangeStart + i;
                const isCurrent = yr === today.getFullYear();
                const isActive = yr === viewYear;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => selectYear(yr)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-400 text-navy-950 font-bold'
                        : isCurrent
                          ? 'bg-navy-700 text-teal-400 font-semibold'
                          : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-navy-700">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setView('days'); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(toDateStr(today.getFullYear(), today.getMonth(), today.getDate()));
                setOpen(false);
                setView('days');
              }}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
