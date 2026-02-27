export async function postToSocial(data: {
  action: 'create_project' | 'add_dataset' | 'create_poll' | 'cast_vote' | 'migrate_dataset';
  projectPda: string;
  walletAddress: string;
  projectSlug?: string;
  signature?: string;
  hash?: string;
  endTs?: number;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/social/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      console.warn("Social post failed (HTTP error):", res.status, res.statusText);
      return false;
    }

    const json = await res.json();
    if (!json.success) {
      console.warn("Social post failed (API error):", json.message || json.error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("Failed to post to social:", e);
    return false;
  }
}
