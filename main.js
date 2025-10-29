import { api } from "./js/api/api.js";
import { messageManager } from "./js/components/messageManager.js";
import { playerManager } from "./js/media/playerManager.js";
import { getParamsFromUrl } from "./js/utils.js";

function main() {
	const { type, isMaster } = getParamsFromUrl(window.location.href);
	const MESSAGE_MANAGER = messageManager();
	let currentSource = null;
	let PLAYER_MANAGER = null;
	let API = null;
	let playTimeoutId = null; // Track timeout to prevent multiple loops

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
				break;
			case "stop":
				// Clear any pending play timeout
				if (playTimeoutId) {
					clearTimeout(playTimeoutId);
					playTimeoutId = null;
				}
				if (PLAYER_MANAGER) PLAYER_MANAGER.stop();
				break;
			case "reload":
				window.location.reload();
				break;
			case "source":
				console.log("Setting source to", data.source);
				if (data.source && data.source !== currentSource) {
					currentSource = data.source;
					if (PLAYER_MANAGER) PLAYER_MANAGER.initMedia(currentSource);
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
	}
	init();
}

window.onload = () => {
	main();
};
