const fs = require("fs");
const { join } = require("path");

/**
 * Scans the videos directory and creates a catalog of all available media
 * @param {string} basePath - Base path to the videos directory
 * @returns {Object} Catalog of all media files organized by type and folder
 */
function scanMediaDirectories(basePath) {
	const catalog = {
		mp4: {},
		png_sequence: {},
	};

	const mp4Path = join(basePath, "mp4");
	const pngSequencePath = join(basePath, "png_sequence");

	// Scan MP4 directories
	if (fs.existsSync(mp4Path)) {
		const mp4Folders = fs
			.readdirSync(mp4Path, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		mp4Folders.forEach((folderName) => {
			const folderPath = join(mp4Path, folderName);
			const files = fs
				.readdirSync(folderPath)
				.filter((file) => file.endsWith(".mp4"));

			catalog.mp4[folderName] = {
				folderName,
				files: files.map((file) => ({
					fileName: file,
					url: `/videos/mp4/${folderName}/${file}`,
					path: join(folderPath, file),
				})),
			};
		});
	}

	// Scan PNG sequence directories
	if (fs.existsSync(pngSequencePath)) {
		const pngFolders = fs
			.readdirSync(pngSequencePath, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		pngFolders.forEach((folderName) => {
			const folderPath = join(pngSequencePath, folderName);
			const files = fs
				.readdirSync(folderPath)
				.filter((file) => file.endsWith(".png"))
				.sort(); // Sort to ensure correct order

			catalog.png_sequence[folderName] = {
				folderName,
				files: files.map((file) => ({
					fileName: file,
					url: `/videos/png_sequence/${folderName}/${file}`,
					path: join(folderPath, file),
				})),
			};
		});
	}

	return catalog;
}

/**
 * Get list of all folder names for a media type
 * @param {Object} catalog - The media catalog
 * @param {string} type - 'mp4' or 'png_sequence'
 * @returns {string[]} Array of folder names
 */
function getFolderNames(catalog, type) {
	if (!catalog[type]) return [];
	return Object.keys(catalog[type]);
}

/**
 * Get all URLs for a specific folder and type
 * @param {Object} catalog - The media catalog
 * @param {string} type - 'mp4' or 'png_sequence'
 * @param {string} folderName - Name of the folder
 * @returns {string[]} Array of URLs
 */
function getFolderUrls(catalog, type, folderName) {
	if (!catalog[type] || !catalog[type][folderName]) return [];
	return catalog[type][folderName].files.map((file) => file.url);
}

/**
 * Get a summary of all available media
 * @param {Object} catalog - The media catalog
 * @returns {Object} Summary with counts and folder lists
 */
function getMediaSummary(catalog) {
	const summary = {
		mp4: {
			folderCount: Object.keys(catalog.mp4 || {}).length,
			folders: Object.keys(catalog.mp4 || {}),
			totalFiles: 0,
		},
		png_sequence: {
			folderCount: Object.keys(catalog.png_sequence || {}).length,
			folders: Object.keys(catalog.png_sequence || {}),
			totalFiles: 0,
		},
	};

	// Count total files
	Object.values(catalog.mp4 || {}).forEach((folder) => {
		summary.mp4.totalFiles += folder.files.length;
	});

	Object.values(catalog.png_sequence || {}).forEach((folder) => {
		summary.png_sequence.totalFiles += folder.files.length;
	});

	return summary;
}

module.exports = {
	scanMediaDirectories,
	getFolderNames,
	getFolderUrls,
	getMediaSummary,
};
