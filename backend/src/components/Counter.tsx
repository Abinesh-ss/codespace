// src/components/Counter.tsx
'use client';
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button
      onClick={() => setCount(count + 1)}
      style={{ padding: "10px 20px", fontSize: 16, marginTop: 20, cursor: "pointer" }}
    >
      Count: {count}
    </button>
  );
}
