// lib/utils.ts
// Minimal utilities used by UI components (shadcn-style)

export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | { [k: string]: any };

export function cn(...inputs: ClassValue[]) {
  const out: string[] = [];

  const push = (v: any) => {
    if (!v) return;

    if (typeof v === "string" || typeof v === "number") {
      out.push(String(v));
      return;
    }

    if (Array.isArray(v)) {
      v.forEach(push);
      return;
    }

    if (typeof v === "object") {
      for (const k of Object.keys(v)) {
        if (v[k]) out.push(k);
      }
    }
  };

  inputs.forEach(push);
  return out.join(" ");
}
