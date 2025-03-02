import { useEffect, useState } from "react";

type StarProps = { top: number; left: number; rotation: number; size: number };
type SafeZoneProps = { top: number; bottom: number; left: number; right: number };

type StarBackgroundProps = {
  safeZone?: SafeZoneProps; // Optional safe zone prop
};

export default function StarBackground({ safeZone }: StarBackgroundProps) {
  const [stars, setStars] = useState<StarProps[]>([]);

  useEffect(() => {
    const generatedStars: StarProps[] = [];
    const minDistance = 8; // Minimum distance between stars

    for (let i = 0; i < 30; i++) {
      let top: number, left: number;
      let tooClose;

      do {
        top = Math.random() * 100;
        left = Math.random() * 100;
        tooClose = generatedStars.some(
          (s) => Math.hypot(s.top - top, s.left - left) < minDistance
        );
      } while (
        safeZone &&
        top > safeZone.top &&
        top < safeZone.bottom &&
        left > safeZone.left &&
        left < safeZone.right
      );

      generatedStars.push({
        top,
        left,
        rotation: Math.random() * 360,
        size: Math.random() * 12 + 10, 
      });
    }

    setStars(generatedStars);
  }, [safeZone]);

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      {stars.map((star, index) => (
        <svg
          key={index}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="star"
          style={{
            position: "absolute",
            top: `${star.top}%`,
            left: `${star.left}%`,
            transform: `rotate(${star.rotation}deg)`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
        >
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
        </svg>
      ))}
    </div>
  );
}