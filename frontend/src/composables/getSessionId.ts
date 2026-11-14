/** The `sessionId` query parameter of the current page URL, or null when it is missing. */
export function getSessionId(search: string = window.location.search): string | null {
  return new URLSearchParams(search).get('sessionId');
}
