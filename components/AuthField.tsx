'use client';

interface AuthFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
}

export default function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
  hint,
  autoComplete,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl bg-white/80 dark:bg-white/5 border px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-sm outline-none transition-all duration-200 hover:border-purple-300 focus:ring-4 focus:ring-purple-500/15 focus:border-purple-500 ${
          error
            ? 'border-red-400 focus:ring-red-500/15 focus:border-red-500'
            : 'border-purple-200/80 dark:border-purple-900/50'
        }`}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}
