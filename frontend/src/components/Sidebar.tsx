import Link from "next/link";
export default function Sidebar() {
  return (
    <aside className="w-60 bg-white shadow-md flex flex-col p-4 gap-4">
      <h2 className="text-xl font-bold text-indigo-600">Navigation</h2>
      <Link href="/dashboard" className="hover:text-indigo-500">Overview</Link>
      <Link href="/upload" className="hover:text-indigo-500">Map Upload</Link>
      <Link href="/editor" className="hover:text-indigo-500">Editor</Link>
      <Link href="/navigate" className="hover:text-indigo-500">Navigate</Link>
      <Link href="/qr" className="hover:text-indigo-500">QR Codes</Link>
      <Link href="/login" className="hover:text-indigo-500">Settings</Link>
    </aside>
  );
}