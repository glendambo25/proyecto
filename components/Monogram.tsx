const TONES = ["bg-ink text-paper", "bg-accent text-white", "bg-stamp text-white", "bg-ok text-white", "bg-paper-2 text-ink"];

export default function Monogram({ name, size = 44, seed = 0 }: { name: string; size?: number; seed?: number }) {
  const initials = name
    .replace(/[^A-Za-zÀ-ÿ ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-serif ${TONES[seed % TONES.length]}`} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      {initials}
    </span>
  );
}
