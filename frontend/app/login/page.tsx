import { Suspense } from "react";
import LoginContent from "./LoginContent";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
