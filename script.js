function main() {
	const ws = new WebSocket(
		(location.protocol === "https:" ? "wss://" : "ws://") + location.host
	);

	// Initialize timesync
	var ts = timesync.create({
		server: "/timesync",
		interval: 1000,
	});

	// Track if user has enabled video playback
	let playbackEnabled = false;

	// Track video sync state
	let lastOffset = 0;
	let videoStartTime = null; // Synchronized time when video started playing
	let currentVideoSrc = null;
	let resyncThreshold = 500; // Resync if offset changes by more than 500ms

	// Create interaction overlay to enable video playback
	function createInteractionOverlay() {
		// const overlay = document.createElement("div");
		// overlay.id = "interaction-overlay";
		// overlay.style.cssText = `
		// 	position: fixed;
		// 	top: 0;
		// 	left: 0;
		// 	width: 100%;
		// 	height: 100%;
		// 	background-color: rgba(0, 0, 0, 0.8);
		// 	display: flex;
		// 	justify-content: center;
		// 	align-items: center;
		// 	z-index: 10000;
		// 	flex-direction: column;
		// 	gap: 20px;
		// `;
		// const message = document.createElement("p");
		// message.textContent = "Tap to enable video playback";
		// message.style.cssText = `
		// 	color: white;
		// 	font-size: 18px;
		// 	text-align: center;
		// 	margin: 0;
		// `;
		// const button = document.createElement("button");
		// button.textContent = "Enable Video";
		// button.style.cssText = `
		// 	padding: 15px 30px;
		// 	font-size: 16px;
		// 	background-color: #4CAF50;
		// 	color: white;
		// 	border: none;
		// 	border-radius: 5px;
		// 	cursor: pointer;
		// `;
		// button.addEventListener("click", () => {
		// 	enablePlayback(overlay);
		// });
		// // Also allow tapping anywhere on overlay
		// overlay.addEventListener("click", (e) => {
		// 	if (e.target === overlay) {
		// 		enablePlayback(overlay);
		// 	}
		// });
		// overlay.appendChild(message);
		// overlay.appendChild(button);
		// document.body.appendChild(overlay);
	}

	// Enable video playback after user interaction
	function enablePlayback(overlay) {
		// Try to play and pause to unlock playback
		if (videoElement.src) {
			videoElement
				.play()
				.then(() => {
					videoElement.pause();
					videoElement.currentTime = 0;
					playbackEnabled = true;
					console.log("Video playback enabled");
					if (overlay) {
						overlay.remove();
					}
				})
				.catch((error) => {
					console.error("Failed to enable playback:", error);
					// Remove overlay anyway
					if (overlay) {
						overlay.remove();
					}
					playbackEnabled = true; // Allow to try anyway
				});
		} else {
			playbackEnabled = true;
			if (overlay) {
				overlay.remove();
			}
		}
	}

	// Create video element if it doesn't exist
	let videoElement = document.getElementById("video-player");

	if (!videoElement) {
		videoElement = document.createElement("video");
		videoElement.id = "video-player";
		videoElement.style.width = "100%";
		videoElement.controls = true;
		videoElement.muted = true;
		videoElement.playsinline = true;
		// Support playsInline in Safari iOS
		videoElement.playsInline = true;
		videoElement.webkitPlaysInline = true;
		videoElement.loop = true;
		videoElement.preload = "auto";
		document.body.appendChild(videoElement);
	}

	// Show interaction overlay on load
	createInteractionOverlay();

	// Function to resync video playback based on current synchronized time
	function resyncVideo() {
		if (!videoElement.src || !videoStartTime || videoElement.paused) {
			return;
		}

		const now = ts.now(); // Current synchronized time
		const elapsedSyncTime = now - videoStartTime; // Time elapsed since video started (in ms)

		if (videoElement.duration && !isNaN(videoElement.duration)) {
			// Calculate what the video time should be based on synchronized time
			const targetVideoTime = (elapsedSyncTime / 1000) % videoElement.duration;

			// Calculate difference between current video time and target time
			const timeDiff = Math.abs(videoElement.currentTime - targetVideoTime);

			// Only adjust if difference is significant (more than 100ms)
			if (timeDiff > 0.1) {
				console.log(
					`Resyncing video: adjusting from ${videoElement.currentTime.toFixed(
						2
					)}s to ${targetVideoTime.toFixed(2)}s (offset: ${(
						targetVideoTime - videoElement.currentTime
					).toFixed(2)}s)`
				);
				videoElement.currentTime = targetVideoTime;
			}
		}
	}

	// Function to load and play video at target time
	function scheduleVideoPlay(videoSrc, targetTime) {
		// Load the video source
		videoElement.src = `/${videoSrc}`;
		currentVideoSrc = videoSrc;
		videoElement.load();

		// Calculate delay until target time
		const checkPlayback = () => {
			const now = ts.now(); // Use synchronized time
			const timeUntilPlay = targetTime - now;

			if (timeUntilPlay <= 0) {
				// It's time to play
				if (!playbackEnabled) {
					console.warn(
						"Playback not enabled yet. Waiting for user interaction."
					);
					// Show overlay again if not enabled
					const existingOverlay = document.getElementById(
						"interaction-overlay"
					);
					if (!existingOverlay) {
						createInteractionOverlay();
					}
					return;
				}

				videoElement.currentTime = 0;
				videoStartTime = now; // Store the synchronized time when video starts
				videoElement.play().catch((error) => {
					console.error("Error playing video:", error);
					if (error.name === "NotAllowedError") {
						console.warn("Playback blocked. User interaction required.");
						createInteractionOverlay();
						playbackEnabled = false;
					}
				});
				console.log(
					"Playing video:",
					videoSrc,
					"at sync time:",
					videoStartTime
				);
			} else {
				// Schedule a check closer to the target time
				const checkDelay = Math.min(timeUntilPlay, 100);
				setTimeout(checkPlayback, checkDelay);
			}
		};

		// Start checking
		checkPlayback();
	}

	// Handle WebSocket messages
	ws.onopen = () => {
		console.log("WebSocket connected");
	};

	ws.onmessage = (event) => {
		try {
			const message = JSON.parse(event.data);
			console.log("Received message:", message);

			switch (message.type) {
				case "play":
					if (message.video && message.targetTime) {
						console.log(
							`Scheduling video ${message.video} to play at ${new Date(
								message.targetTime
							).toISOString()}`
						);
						scheduleVideoPlay(message.video, message.targetTime);
					}
					break;
				case "pause":
					videoElement.pause();
					videoStartTime = null; // Reset start time when paused
					console.log("Video paused");
					break;
				case "stop":
					videoElement.pause();
					videoElement.currentTime = 0;
					videoStartTime = null; // Reset start time when stopped
					console.log("Video stopped");
					break;
				case "reload":
					window.location.reload();
					break;
				case "welcome":
					console.log("Welcome:", message.message);
					break;
				default:
					console.log("Unknown message type:", message.type);
			}
		} catch (error) {
			console.error("Error parsing message:", error);
		}
	};

	ws.onerror = (error) => {
		console.error("WebSocket error:", error);
	};

	ws.onclose = () => {
		console.log("WebSocket disconnected");
	};

	// get notified on changes in the offset
	ts.on("change", function (offset) {
		console.log("Timesync offset changed: " + offset + " ms");

		// Check if offset changed significantly
		const offsetChange = Math.abs(offset - lastOffset);

		if (offsetChange > resyncThreshold) {
			console.log(
				`Significant offset change detected: ${offsetChange}ms (threshold: ${resyncThreshold}ms)`
			);
			resyncVideo();
		}

		lastOffset = offset;
	});
}

window.onload = () => {
	main();
};
