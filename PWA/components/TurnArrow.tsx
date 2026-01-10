"use client";
export default function TurnArrow({ direction }: { direction: number }) {
  return (
    <div style={{
      width: 60,
      height: 60,
      transform: `rotate(${direction}deg)`,
      transition: "transform 0.3s"
    }}>
      ⬆️
    </div>
  );
}