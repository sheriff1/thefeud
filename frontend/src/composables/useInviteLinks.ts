import { ref } from 'vue';

export const INVITE_BOX_DEFAULT_TEXT = '🔗  Invite Others';
export const INVITE_BOX_RESET_MS = 2000;

export type InviteType = 'id' | 'host' | 'team' | 'spectator';

/** What the "Invite Others" options copy: the bare session ID, or a link to a page. */
export function inviteText(type: InviteType, sessionId: string | null, origin: string): string {
  return type === 'id' ? sessionId || '' : `${origin}/${type}?sessionId=${sessionId}`;
}

export interface InviteLinkDeps {
  writeText?: (text: string) => Promise<void>;
  origin?: () => string;
  setTimer?: (fn: () => void, ms: number) => unknown;
}

/**
 * The "Invite Others" floating box shared by the host and team/spectator views: copies a session
 * ID or link to the clipboard, shows "Copied!" or "Error" in the box, and resets it after 2s.
 *
 * `copyInvite` never rejects. The view closes its dialog after awaiting it. Browser globals are
 * read when used, and can be injected for tests.
 */
export function useInviteLinks(sessionId: string | null, deps: InviteLinkDeps = {}) {
  const sessionIdBoxText = ref(INVITE_BOX_DEFAULT_TEXT);
  const sessionIdBoxState = ref('');

  const setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const reset = () => {
    sessionIdBoxText.value = INVITE_BOX_DEFAULT_TEXT;
    sessionIdBoxState.value = '';
  };

  async function copyInvite(type: InviteType): Promise<void> {
    const origin = deps.origin ? deps.origin() : window.location.origin;
    const text = inviteText(type, sessionId, origin);
    try {
      await (deps.writeText ?? ((t) => navigator.clipboard.writeText(t)))(text);
      sessionIdBoxText.value = 'Copied!';
      sessionIdBoxState.value = 'copied';
    } catch {
      sessionIdBoxText.value = 'Error';
      sessionIdBoxState.value = 'error';
    }
    setTimer(reset, INVITE_BOX_RESET_MS);
  }

  return { sessionIdBoxText, sessionIdBoxState, copyInvite };
}
