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
			return new Promise((resolve, reject) => {
				element.src = `/videos/mp4/${src}/${src}.mp4`;
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
			const urls = await fetchPNGUrls(src);
			return Promise.all(urls.map((url) => loadPNG(url)));
		}
	};

	const loadPNG = async (src) => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.src = src;
			img.onload = () => {
				messageMgr.showMessage("PNG sequence loaded");
				resolve(img);
			};
			img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
		});
	};

	const fetchPNGUrls = (src) => {
		return fetch(`/api/media/png_sequence/${src}`)
			.then((response) => {
				if (!response.ok) throw new Error("Failed to fetch PNG sequence URLs");
				return response.json();
			})
			.then((data) => {
				return data.urls;
			});
	};
	return { preload, loadVideo, loadPngSequence };
};
