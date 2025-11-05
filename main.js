import { api } from "./js/api/api.js";
import { messageManager } from "./js/components/messageManager.js";
import { playerManager } from "./js/media/playerManager.js";
import { getParamsFromUrl } from "./js/utils.js";

function main() {
	const {
		type,
		isMaster,
		source: urlSource,
		media: urlMedia,
		project: urlProject,
	} = getParamsFromUrl(window.location.href);
	console.log("URL params:", {
		type,
		isMaster,
		source: urlSource,
		media: urlMedia,
		project: urlProject,
	});

	const MESSAGE_MANAGER = messageManager();
	let currentSource = urlSource; // Use source from URL if provided
	let currentMedia = urlMedia; // Store the media type from URL (poster, phone, billboard, etc.)
	let PLAYER_MANAGER = null;
	let API = null;
	let playTimeoutId = null; // Track timeout to prevent multiple loops
	let hasReceivedInitialSource = false; // Track if we've received the initial source from server
	let audioElement = null; // Audio element for music playback (billboard)

	// Initialize API first to get timesync function
	const onMessageHandler = (event, data) => {
		if (event != "offsetState") {
			MESSAGE_MANAGER.showMessage(event);
		}
		switch (event) {
			case "play":
				if (data.targetTime) {
					// Clear any existing play timeout
					if (playTimeoutId) {
						clearTimeout(playTimeoutId);
						playTimeoutId = null;
					}
					onPlayHandler(data.targetTime);
				}
				break;
			case "pause":
				// Clear any pending play timeout
				if (playTimeoutId) {
					clearTimeout(playTimeoutId);
					playTimeoutId = null;
				}
				if (PLAYER_MANAGER) PLAYER_MANAGER.pause();
				// Pause audio if playing
				if (audioElement) {
					audioElement.pause();
					console.log("Music paused");
				}
				break;
			case "stop":
				// Clear any pending play timeout
				if (playTimeoutId) {
					clearTimeout(playTimeoutId);
					playTimeoutId = null;
				}
				if (PLAYER_MANAGER) PLAYER_MANAGER.stop();
				// Stop and reset audio
				if (audioElement) {
					audioElement.pause();
					audioElement.currentTime = 0;
					console.log("Music stopped");
				}
				break;
			case "reload":
				window.location.reload();
				break;
			case "source":
				console.log("Received source from server:", data.source);

				let sourceToUse = null;

				// If we have a specific media type from URL (e.g., ?media=phone)
				if (currentMedia) {
					// Extract project from server source (e.g., "test-cavalry-project/poster" -> "test-cavalry-project")
					const projectFromServer = data.source
						? data.source.split("/")[0]
						: null;

					if (projectFromServer) {
						// Combine server project with our media type
						sourceToUse = `${projectFromServer}/${currentMedia}`;
						console.log(
							`Using media type '${currentMedia}' with project '${projectFromServer}': ${sourceToUse}`
						);
					}
				}
				// If we have a complete URL source (e.g., ?source=test-cavalry-project/phone)
				else if (urlSource && !hasReceivedInitialSource) {
					sourceToUse = urlSource;
					console.log("Using complete URL source:", sourceToUse);
				}
				// Otherwise use server source as-is
				else if (data.source) {
					sourceToUse = data.source;
					console.log("Using server source:", sourceToUse);
				}

				// Apply the source if it's different
				if (sourceToUse && sourceToUse !== currentSource) {
					currentSource = sourceToUse;
					hasReceivedInitialSource = true;
					if (PLAYER_MANAGER) PLAYER_MANAGER.initMedia(currentSource);

					// If this is a billboard, also load the music
					if (sourceToUse.includes("/billboard")) {
						loadAndPlayMusic(sourceToUse);
					}
				} else if (!hasReceivedInitialSource) {
					hasReceivedInitialSource = true;
				}
				break;
			case "offsetState":
				// Handle timesync offset changes for resyncing
				if (
					data.difference &&
					PLAYER_MANAGER &&
					PLAYER_MANAGER.handleOffsetChange
				) {
					PLAYER_MANAGER.handleOffsetChange(data.difference);
				}
				break;
			default:
				break;
		}
	};

	API = api(onMessageHandler);

	// Initialize player manager with timesync function
	PLAYER_MANAGER = playerManager(type, isMaster, API.getTs);

	function onPlayHandler(targetTime, isFirstCall = true) {
		const now = API.getTs();
		const timeUntilPlay = targetTime - now;

		// Log only on first call to avoid console spam
		if (isFirstCall) {
			console.log(
				`[PlayHandler] Scheduled playback in ${timeUntilPlay}ms at ${new Date(
					targetTime
				).toISOString()}`
			);
		}

		if (timeUntilPlay <= 0) {
			// Time to play!
			console.log("[PlayHandler] Starting playback now");
			playTimeoutId = null;
			PLAYER_MANAGER.playAt(targetTime);

			// Also play music if we're on billboard
			if (
				audioElement &&
				currentSource &&
				currentSource.includes("/billboard")
			) {
				console.log("Starting music playback with visuals");
				audioElement
					.play()
					.catch((err) => console.error("Error playing audio:", err));
			}

			return;
		}

		// Schedule next check
		const checkDelay = Math.min(timeUntilPlay, 10);
		playTimeoutId = setTimeout(
			() => onPlayHandler(targetTime, false),
			checkDelay
		);
	}

	function init() {
		PLAYER_MANAGER.create();

		// If complete source was provided in URL, load it immediately
		if (currentSource) {
			console.log("Loading media from URL:", currentSource);
			PLAYER_MANAGER.initMedia(currentSource);

			// If this is a billboard, also load and play music
			if (currentSource.includes("/billboard")) {
				loadAndPlayMusic(currentSource);
			}
		}
		// If only media type was provided, wait for server to send project
		else if (currentMedia) {
			console.log(
				`Waiting for project from server, will use media type: ${currentMedia}`
			);
		}
	}

	// Function to load and play music for billboard
	async function loadAndPlayMusic(source) {
		try {
			// Extract project name from source (e.g., "test-cavalry-project/billboard" -> "test-cavalry-project")
			const projectName = source.split("/")[0];

			console.log(
				`Billboard detected, loading music for project: ${projectName}`
			);

			// Fetch project data to get music files
			const response = await fetch(`/api/media/projects/${projectName}/music`);
			if (!response.ok) {
				console.log("No music available for this project");
				return;
			}

			const musicData = await response.json();
			if (!musicData.data || musicData.data.length === 0) {
				console.log("No music files found");
				return;
			}

			// Use the first music file
			const musicUrl = musicData.data[0].url;
			console.log("Loading music:", musicUrl);

			// Create or reuse audio element
			if (!audioElement) {
				audioElement = new Audio();
				audioElement.loop = true; // Loop the music
				audioElement.volume = 1.0;

				// Register audio element with player manager for synchronization
				if (PLAYER_MANAGER && PLAYER_MANAGER.setAudioElement) {
					PLAYER_MANAGER.setAudioElement(audioElement);
					console.log("Audio element registered with sync manager");
				}
			}

			audioElement.src = musicUrl;

			// Don't play yet, wait for play command
			MESSAGE_MANAGER.showMessage("Music loaded");
		} catch (error) {
			console.error("Error loading music:", error);
		}
	}

	init();
}

window.onload = () => {
	main();
};
