// Simple inline brand monograms for model providers.
// Uses brand-recognizable colors; rendered as a small square badge.

type Props = { name: string; size?: number };

function badge(bg: string, fg: string, label: string, size: number) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center font-mono font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.5,
        lineHeight: 1,
        borderRadius: 2,
      }}
    >
      {label}
    </span>
  );
}

export function ModelLogo({ name, size = 16 }: Props) {
  const n = name.toLowerCase();
  if (n.includes("gemini"))   return badge("#4285F4", "#fff", "G", size);
  if (n.includes("gpt"))      return badge("#10A37F", "#fff", "◯", size);
  if (n.includes("qwen"))     return badge("#615CED", "#fff", "Q", size);
  if (n.includes("deepseek")) return badge("#4D6BFE", "#fff", "D", size);
  if (n.includes("llama"))    return badge("#0866FF", "#fff", "L", size);
  if (n.includes("silicon"))  return badge("var(--info)", "#fff", "S", size);
  if (n.includes("n-gram"))   return badge("var(--muted-foreground)", "var(--background)", "n", size);
  return null;
}
