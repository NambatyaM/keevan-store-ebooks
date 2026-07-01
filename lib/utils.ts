export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function NoopCache<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return fn;
}
