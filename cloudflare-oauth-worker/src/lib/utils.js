/**
 * General utility functions
 */

/**
 * Detect state changes between previous and new state arrays
 */
export function detectStateChanges(previousStates, newStates) {
	// Handle null/undefined inputs
	const prev = previousStates || [];
	const next = newStates || [];
	
	const previousSet = new Set(prev);
	const newSet = new Set(next);
	
	const added = next.filter(state => !previousSet.has(state));
	const removed = prev.filter(state => !newSet.has(state));
	
	return { added, removed };
}

/**
 * Anonymize email address for privacy
 */
export function anonymizeEmail(email) {
	if (!email || typeof email !== 'string') return email;
	
	const atIndex = email.indexOf('@');
	if (atIndex === -1) return email;
	
	const alias = email.substring(0, atIndex);
	const domain = email.substring(atIndex);
	
	if (alias.length <= 1) return email;
	
	const firstLetter = alias.charAt(0);
	// Take the last 4 characters, but if the username is short, take what's available
	const lastFourLetters = alias.length >= 4 ? alias.slice(-4) : alias.slice(1);
	const stars = '*'.repeat(Math.max(1, alias.length - 5));
	
	return `${firstLetter}${stars}${lastFourLetters}${domain}`;
}

/**
 * Get current month-year string for game data organization
 */
export function getCurrentMonthYear() {
	return new Date().toLocaleString('default', { month: 'long' }) + '-' + new Date().getFullYear();
}
