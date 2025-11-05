import { videoPlayer } from "./videoPlayer.js";
import { pngSequencePlayer } from "./pngSequencePlayer.js";
import { loadMediaManager } from "./loadMediaManager.js";
import { messageManager } from "../components/messageManager.js";
import { syncManager } from "./syncManager.js";

export const playerManager = (type, isMaster, getTimeSyncNow) => {
	let container = document.getElementById("player-container");
	let player =
		type == "video"
			? videoPlayer(container, isMaster)
			: pngSequencePlayer(container);
	let loadManager = loadMediaManager(type);
	const messageMgr = messageManager();
	// Pass isMaster flag to syncManager - master device won't be time-corrected
	const syncMgr = getTimeSyncNow ? syncManager(getTimeSyncNow, isMaster) : null;

	const create = () => {
		const element = player.create();
		if (container) {
			container.appendChild(element);
		}
	};

	const initMedia = async (src) => {
		console.log(player.getElement());
		messageMgr.showMessage("Loading media...");
		await loadManager.preload(src, player.getElement()).then((result) => {
			if (type == "pngSequence") {
				player.setImages(result);
			}
			console.log("Media loaded");
			return result;
		});
		// return result;
	};

	const playAt = (targetTime) => {
		// If syncManager is available, use it for synchronized playback
		if (syncMgr) {
			syncMgr.startPlayback(player, targetTime);
		}

		player.setCurrentTime(0);
		player.play();
	};

	const pause = () => {
		if (syncMgr) {
			syncMgr.pausePlayback();
		}
		if (player.pause) {
			player.pause();
		}
	};

	const stop = () => {
		if (syncMgr) {
			syncMgr.stopPlayback();
		}
		if (player.stop) {
			player.stop();
		}
	};

	// FIX the handleOffsetChange function to work with the syncManager
	const handleOffsetChange = (offsetChange) => {
		// messageMgr.showMessage(
		// 	"Offset change detected: NOT USED FOR NOW " + offsetChange + "ms"
		// );
		// if (syncMgr) {
		// 	syncMgr.handleOffsetChange(offsetChange);
		// }
	};

	const forceResync = () => {
		if (syncMgr) {
			syncMgr.forceResync();
		}
	};

	const setAudioElement = (audio) => {
		if (syncMgr && syncMgr.setAudioElement) {
			syncMgr.setAudioElement(audio);
		}
	};

	return {
		create,
		initMedia,
		playAt,
		pause,
		stop,
		handleOffsetChange,
		forceResync,
		setAudioElement, // For billboard devices to register audio element
	};
};
