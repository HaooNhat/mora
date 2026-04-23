interface Props {
  label: string;
}

export function AuthDivider({ label }: Props) {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="px-3 bg-white dark:bg-gray-900 text-gray-400">
          {label}
        </span>
      </div>
    </div>
  );
}
