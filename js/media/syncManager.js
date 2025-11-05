/**
 * Sync Manager - Handles synchronized playback across multiple clients
 * Uses server timesync as the single source of truth
 */
export const syncManager = (getTimeSyncNow, isMaster = false) => {
	let playbackStartTime = null; // Synchronized server time when playback started
	let syncCheckInterval = null;
	let player = null;
	let isActive = false;
	let audioElement = null; // Audio element for billboard sync

	const SYNC_CHECK_INTERVAL = 1000; // Check sync every second
	const SYNC_THRESHOLD = 0.1; // Resync if off by more than 100ms
	const AUDIO_SYNC_THRESHOLD = 0.05; // Sync audio more precisely (50ms)

	/**
	 * Start synchronized playback
	 * @param {Object} playerInstance - The player instance (video or PNG sequence)
	 * @param {number} targetTime - Synchronized server time when playback should start
	 */
	const startPlayback = (playerInstance, targetTime) => {
		player = playerInstance;
		playbackStartTime = targetTime;
		isActive = true;

		console.log(
			`[SyncManager] Playback scheduled at server time: ${new Date(
				targetTime
			).toISOString()}`
		);

		// Start periodic sync checking
		startSyncChecking();
	};

	/**
	 * Stop synchronized playback and sync checking
	 */
	const stopPlayback = () => {
		isActive = false;
		playbackStartTime = null;
		stopSyncChecking();
	};

	/**
	 * Pause playback (stop sync checking but remember position)
	 */
	const pausePlayback = () => {
		isActive = false;
		stopSyncChecking();
	};

	/**
	 * Get the current playback time based on synchronized server time
	 * @returns {number} Current playback time in seconds
	 */
	const getCurrentPlaybackTime = () => {
		if (!playbackStartTime) return 0;

		const now = getTimeSyncNow();
		const elapsedMs = now - playbackStartTime;
		return elapsedMs / 1000; // Convert to seconds
	};

	/**
	 * Check if player is in sync and adjust if needed
	 * If audio element is present, keeps audio and visuals in sync
	 */
	const checkAndResync = () => {
		if (!isActive || !player || !playbackStartTime) return;

		let rawExpectedTime = getCurrentPlaybackTime();
		let actualTime = 0;
		let duration = 0;

		// MASTER WITH AUDIO: Audio is the reference, sync PNG sequence to it
		if (isMaster && audioElement) {
			const audioTime = audioElement.currentTime || 0;

			// Get visual player's current time
			if (player.getCurrentTime) {
				actualTime = player.getCurrentTime();
			}

			const timeDiff = Math.abs(audioTime - actualTime);

			if (timeDiff > SYNC_THRESHOLD) {
				console.log(
					`[SyncManager] MASTER: Syncing visuals to audio. Audio at ${audioTime.toFixed(
						3
					)}s, visuals at ${actualTime.toFixed(3)}s, diff: ${timeDiff.toFixed(
						3
					)}s`
				);

				// Sync PNG sequence to audio timeline
				if (player.setCurrentTime) {
					player.setCurrentTime(audioTime);
				}
			}
			return; // Don't do standard sync for master
		}

		// Get actual time and duration from player
		if (player.getCurrentTime) {
			actualTime = player.getCurrentTime();
		} else if (
			player.getElement &&
			player.getElement().currentTime !== undefined
		) {
			// For video elements
			actualTime = player.getElement().currentTime;
		}

		// Get duration
		if (player.getDuration) {
			duration = player.getDuration();
		} else if (
			player.getElement &&
			player.getElement().duration !== undefined &&
			!isNaN(player.getElement().duration)
		) {
			duration = player.getElement().duration;
		}

		// Handle looping: wrap expected time to video duration
		let expectedTime = rawExpectedTime;
		if (duration > 0) {
			expectedTime = rawExpectedTime % duration;
		}

		const timeDiff = Math.abs(expectedTime - actualTime);

		// Sync PNG sequence to expected time
		if (timeDiff > SYNC_THRESHOLD) {
			console.log(
				`[SyncManager] Visual drift: ${timeDiff.toFixed(
					3
				)}s. Resyncing from ${actualTime.toFixed(3)}s to ${expectedTime.toFixed(
					3
				)}s`
			);

			// Resync the player
			if (player.setCurrentTime) {
				player.setCurrentTime(expectedTime);
			} else if (
				player.getElement &&
				player.getElement().currentTime !== undefined
			) {
				player.getElement().currentTime = expectedTime;
			}
		}

		// SLAVE WITH AUDIO: Also sync audio to expected time
		if (audioElement && !isMaster) {
			const audioTime = audioElement.currentTime || 0;
			const audioTimeDiff = Math.abs(expectedTime - audioTime);

			if (audioTimeDiff > AUDIO_SYNC_THRESHOLD) {
				console.log(
					`[SyncManager] SLAVE: Audio drift: ${audioTimeDiff.toFixed(
						3
					)}s. Syncing audio from ${audioTime.toFixed(
						3
					)}s to ${expectedTime.toFixed(3)}s`
				);

				// Sync audio to expected time
				audioElement.currentTime = expectedTime;
			}
		}
	};

	/**
	 * Start periodic sync checking
	 */
	const startSyncChecking = () => {
		stopSyncChecking(); // Clear any existing interval

		syncCheckInterval = setInterval(() => {
			checkAndResync();
		}, SYNC_CHECK_INTERVAL);

		console.log(
			`[SyncManager] Sync checking started (every ${SYNC_CHECK_INTERVAL}ms)`
		);
	};

	/**
	 * Stop periodic sync checking
	 */
	const stopSyncChecking = () => {
		if (syncCheckInterval) {
			clearInterval(syncCheckInterval);
			syncCheckInterval = null;
			console.log("[SyncManager] Sync checking stopped");
		}
	};

	/**
	 * Manual resync - forces immediate sync check
	 */
	const forceResync = () => {
		console.log("[SyncManager] Force resync triggered");
		checkAndResync();
	};

	/**
	 * Handle timesync offset changes
	 * @param {number} offsetChange - How much the offset changed
	 */
	const handleOffsetChange = (offsetChange) => {
		const OFFSET_THRESHOLD = 100; // 100ms

		if (isActive && offsetChange > OFFSET_THRESHOLD) {
			console.log(
				`[SyncManager] Large offset change detected (${offsetChange}ms), forcing resync`
			);
			forceResync();
		}
	};

	/**
	 * Set audio element for synchronization
	 * @param {HTMLAudioElement} audio - Audio element to sync
	 */
	const setAudioElement = (audio) => {
		audioElement = audio;
		if (isMaster) {
			console.log(
				"[SyncManager] MASTER: Audio element registered as timing reference (visuals will sync to audio)"
			);
		} else {
			console.log(
				"[SyncManager] SLAVE: Audio element registered for sync (will be kept in sync with visuals)"
			);
		}
	};

	return {
		startPlayback,
		stopPlayback,
		pausePlayback,
		getCurrentPlaybackTime,
		checkAndResync,
		forceResync,
		handleOffsetChange,
		setAudioElement,
	};
};
