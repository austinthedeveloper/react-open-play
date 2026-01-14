export function getCombinations<T>(items: T[], size: number): T[][] {
  const results: T[][] = [];
  const combo: T[] = [];

  const walk = (start: number, depth: number) => {
    if (depth === size) {
      results.push([...combo]);
      return;
    }

    for (let i = start; i <= items.length - (size - depth); i += 1) {
      combo.push(items[i]);
      walk(i + 1, depth + 1);
      combo.pop();
    }
  };

  walk(0, 0);
  return results;
}
