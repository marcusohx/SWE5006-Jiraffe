const STORAGE_KEY = "jiraffe:lastSelectedTeamId";

/**
 * Save the selected team ID to localStorage
 */
export function saveSelectedTeamId(teamId: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(teamId));
  } catch (error) {
    // Silently fail if localStorage is unavailable (e.g., private browsing)
    console.warn("Failed to save team selection to localStorage:", error);
  }
}

/**
 * Retrieve the last selected team ID from localStorage
 * Returns null if not found or invalid
 */
export function getLastSelectedTeamId(): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const teamId = Number.parseInt(stored, 10);
    return Number.isInteger(teamId) ? teamId : null;
  } catch (error) {
    // Silently fail if localStorage is unavailable
    console.warn("Failed to read team selection from localStorage:", error);
    return null;
  }
}
