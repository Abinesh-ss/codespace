import { ReactNode } from "react";

interface CardProps {
  /** Optional metric props */
  title?: string;
  value?: string;
  icon?: ReactNode;

  /** Layout usage */
  children?: ReactNode;
  className?: string;
}

export default function Card({
  title,
  value,
  icon,
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition ${className}`}
    >
      {/* Metric Card Mode */}
      {(title || value) && (
        <div className="flex flex-col gap-2 mb-4">
          {icon && <div className="text-indigo-500">{icon}</div>}
          {title && <h3 className="text-sm text-gray-500">{title}</h3>}
          {value && <p className="text-2xl font-bold text-gray-900">{value}</p>}
        </div>
      )}

      {/* Layout Card Mode */}
      {children}
    </div>
  );
}

