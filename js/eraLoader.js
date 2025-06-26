/**
 * Era Loader - Dynamically loads era modules
 * Handles async loading and caching of era data
 */

export class EraLoader {
	constructor(eraRegistry) {
		this.eraRegistry = eraRegistry;
		this.loadedEras = new Map();
		this.loadingPromises = new Map();
	}

	/**
	 * Load era data asynchronously
	 */
	async loadEra(eraId) {
		// Return cached era if already loaded
		if (this.loadedEras.has(eraId)) {
			return this.loadedEras.get(eraId);
		}

		// Return existing loading promise if already loading
		if (this.loadingPromises.has(eraId)) {
			return this.loadingPromises.get(eraId);
		}

		// Start loading the era
		const loadingPromise = this._loadEraModule(eraId);
		this.loadingPromises.set(eraId, loadingPromise);

		try {
			const eraData = await loadingPromise;
			this.loadedEras.set(eraId, eraData);
			this.loadingPromises.delete(eraId);
			return eraData;
		} catch (error) {
			this.loadingPromises.delete(eraId);
			throw error;
		}
	}

	/**
	 * Internal method to load era module
	 */
	async _loadEraModule(eraId) {
		try {
			const eraModule = await import(`./data/eras/${eraId}.js`);
			const eraData = eraModule[`${eraId}Era`];

			if (!eraData) {
				throw new Error(`Era data not found for ${eraId}`);
			}

			return eraData;
		} catch (error) {
			console.error('Failed to load era:', eraId, error);
			throw new Error(`Failed to load era: ${eraId}`);
		}
	}

	/**
	 * Preload multiple eras
	 */
	async preloadEras(eraIds) {
		const loadPromises = eraIds.map((eraId) => this.loadEra(eraId));
		return Promise.all(loadPromises);
	}

	/**
	 * Check if era is loaded
	 */
	isEraLoaded(eraId) {
		return this.loadedEras.has(eraId);
	}

	/**
	 * Get loaded era data (synchronous)
	 */
	getLoadedEra(eraId) {
		return this.loadedEras.get(eraId) || null;
	}

	/**
	 * Clear cached era data
	 */
	clearCache(eraId = null) {
		if (eraId) {
			this.loadedEras.delete(eraId);
			this.loadingPromises.delete(eraId);
		} else {
			this.loadedEras.clear();
			this.loadingPromises.clear();
		}
	}

	/**
	 * Get all loaded eras
	 */
	getLoadedEras() {
		return Array.from(this.loadedEras.keys());
	}
}

// Legacy function for backward compatibility
export async function loadEra(eraId) {
	try {
		const eraModule = await import(`./data/eras/${eraId}.js`);
		return eraModule[`${eraId}Era`];
	} catch (error) {
		console.error('Failed to load era:', eraId, error);
		return null;
	}
}
