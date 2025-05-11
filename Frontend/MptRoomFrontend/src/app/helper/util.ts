export function encodeId(id: number): string {
  return btoa(id.toString()).replace(/=+$/, '');
}

export function decodeId(hash: string): number {
  return parseInt(atob(hash));
}
