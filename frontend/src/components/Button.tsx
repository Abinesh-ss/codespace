import { ReactNode } from "react";
export default function Button({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-500 transition"
    >
      {children}
    </button>
  );
}