/**
 * Generate a unique ID
 * Uses crypto.randomUUID() if available, falls back to timestamp + random + counter
 */
let counter = 0;
export function generateUniqueId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback: timestamp + counter + random
    return `${Date.now()}-${++counter}-${Math.random().toString(36).slice(2, 9)}`;
}
