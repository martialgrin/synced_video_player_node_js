import { messageManager } from "../components/messageManager.js";
export const loadMediaManager = (type) => {
	let messageMgr = messageManager();
	const preload = (src, element) => {
		if (type === "video") {
			return loadVideo(src, element);
		}
		if (type === "pngSequence") {
			return loadPngSequence(src, element);
		}
	};

	const loadVideo = (src, element) => {
		if (element && type === "video") {
			return new Promise(async (resolve, reject) => {
				let videoUrl;

				if (src.includes("/")) {
					try {
						const parts = src.split("/");
						const projectName = parts[0];
						const restPath = parts.slice(1).join("/"); // e.g., "poster" or "album/1"

						const response = await fetch(
							`/api/media/projects/${projectName}/${restPath}`
						);
						if (!response.ok) {
							throw new Error(
								`Failed to fetch video metadata: ${response.status} ${response.statusText}`
							);
						}

						const data = await response.json();

						// data.data should contain file objects with url property
						// For video, we expect a single MP4 file or take the first one
						if (data.data && data.data.length > 0) {
							// Find the first MP4 file
							const videoFile = data.data.find((file) =>
								file.url.toLowerCase().endsWith(".mp4")
							);
							if (videoFile) {
								videoUrl = videoFile.url;
							} else {
								throw new Error("No MP4 file found in the specified directory");
							}
						} else {
							throw new Error("No files found in the specified directory");
						}
					} catch (error) {
						console.error("Error fetching video metadata:", error);
						reject(error);
						return;
					}
				}
				element.src = videoUrl;
				element.onloadeddata = () => {
					messageMgr.showMessage("Video loaded");
					resolve();
				};
				element.onerror = (error) => {
					console.error("Error preloading video:", error);
					reject(error);
				};
			});
		}
	};

	const loadPngSequence = async (src) => {
		if (type === "pngSequence") {
			// Just fetch the URLs list, don't preload all images
			const urls = await fetchPNGUrls(src);
			messageMgr.showMessage(`PNG sequence ready: ${urls.length} frames`);
			// Return the URLs array directly - images will be loaded on-demand
			return urls;
		}
	};

	const loadPNG = async (src) => {
		// Keep this function for potential future use, but not used in main flow
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.src = src;
			img.onload = () => {
				messageMgr.showMessage("PNG loaded");
				resolve(img);
			};
			img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
		});
	};

	const fetchPNGUrls = (src) => {
		// New format:
		//   - "projectName/mediaType" e.g., "test-cavalry-project/poster"
		//   - "projectName/album/subfolder" e.g., "test-cavalry-project/album/1"
		// Old format: src was just a folder name like "0"

		// Check if using new format (contains a slash)
		if (src.includes("/")) {
			// Split the src into parts
			const parts = src.split("/");
			const projectName = parts[0];
			const restPath = parts.slice(1).join("/"); // e.g., "poster" or "album/1"

			return fetch(`/api/media/projects/${projectName}/${restPath}`)
				.then((response) => {
					if (!response.ok)
						throw new Error(
							`Failed to fetch PNG sequence URLs: ${response.status} ${response.statusText}`
						);
					return response.json();
				})
				.then((data) => {
					// New API returns data.data which is an array of file objects
					return data.data.map((file) => file.url);
				});
		} else {
			// Backward compatibility with old format
			return fetch(`/api/media/png_sequence/${src}`)
				.then((response) => {
					if (!response.ok)
						throw new Error("Failed to fetch PNG sequence URLs");
					return response.json();
				})
				.then((data) => {
					return data.urls;
				});
		}
	};
	return { preload, loadVideo, loadPngSequence };
};
