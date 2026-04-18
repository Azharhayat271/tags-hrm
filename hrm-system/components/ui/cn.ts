export type ClassValue = string | false | null | undefined | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  const out: string[] = [];
  const stack: ClassValue[] = [...classes];
  while (stack.length) {
    const v = stack.shift();
    if (!v) continue;
    if (Array.isArray(v)) stack.unshift(...v);
    else out.push(v);
  }
  return out.join(" ");
}
