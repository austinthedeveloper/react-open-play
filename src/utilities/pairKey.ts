export function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}
