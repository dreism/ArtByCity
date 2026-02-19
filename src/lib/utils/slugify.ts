export function slugify(...parts: string[]): string {
  return parts
    .map(p =>
      p.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    )
    .join('-');
}

export function cityKey(country: string, city: string): string {
  return slugify(country, city);
}
