export function createWebSocketHandlers(
	state,
	moveSlide,
	apiGetter,
	MESSAGE_MANAGER,
	updateButtonState = null,
	getSyncManager = null,
	playIndicator = null
) {
	function handlePlayCommand(targetTime, isFirstCall = true) {
		const now = apiGetter().getTs();
		const timeUntilPlay = targetTime - now;
		if (isFirstCall) {
			MESSAGE_MANAGER.showMessage(
				`Playing in ${Math.ceil(timeUntilPlay / 1000)}s...`
			);
		}
		if (timeUntilPlay <= 0) {
			state.playTimeoutId = null;
			state.playbackStartTime = targetTime;
			if (state.slides[state.currentSlideIndex]) {
				// Show play indicator
				if (playIndicator) playIndicator.show();

				state.slides[state.currentSlideIndex].play();
				state.isPlaying = true;
				MESSAGE_MANAGER.showMessage("Playing");
				if (updateButtonState) updateButtonState();
				// Start sync checking for non-master devices
				if (getSyncManager && getSyncManager()) {
					getSyncManager().start();
				}
			}
			return;
		}

		const checkDelay = Math.min(timeUntilPlay, 10);
		state.playTimeoutId = setTimeout(
			() => handlePlayCommand(targetTime, false),
			checkDelay
		);
	}

	function clearPlayTimeout() {
		if (state.playTimeoutId) {
			clearTimeout(state.playTimeoutId);
			state.playTimeoutId = null;
		}
	}

	function handleSourceCommand(source) {
		if (!source) return;

		// Find the exact item matching this sourceId
		// e.g., "Dynamic-ID/album/2" or "Dynamic-ID/phone/1"
		const targetIndex = state.albumData.findIndex(
			(item) => item.sourceId === source
		);

		// Only move if we're not already at this exact item
		// This prevents reacting to our own broadcast messages
		const currentItem = state.albumData[state.currentSlideIndex];
		const isAlreadyAtThisSource =
			currentItem && currentItem.sourceId === source;

		if (targetIndex !== -1 && !isAlreadyAtThisSource) {
			console.log(`Navigating to: ${source} (index ${targetIndex})`);
			moveSlide(targetIndex);
		}
	}

	function createMessageHandler() {
		return (event, data) => {
			if (event !== "offsetState") {
				MESSAGE_MANAGER.showMessage(event);
			}
			const handlers = {
				play: () => {
					clearPlayTimeout();
					if (data.targetTime) {
						handlePlayCommand(data.targetTime);
					} else if (state.slides[state.currentSlideIndex]) {
						// Show play indicator
						if (playIndicator) playIndicator.show();

						state.slides[state.currentSlideIndex].play();
						state.isPlaying = true;
						state.playbackStartTime = Date.now(); // Set start time for sync
						if (updateButtonState) updateButtonState();
						// Start sync for immediate play too
						if (getSyncManager && getSyncManager()) {
							getSyncManager().start();
						}
					}
				},
				pause: () => {
					clearPlayTimeout();
					if (getSyncManager && getSyncManager()) {
						getSyncManager().stop();
					}
					state.slides.forEach((slide) => slide.pause());
					state.isPlaying = false;
					if (updateButtonState) updateButtonState();
				},
				stop: () => {
					clearPlayTimeout();
					if (getSyncManager && getSyncManager()) {
						getSyncManager().stop();
					}
					state.playbackStartTime = null;
					state.slides.forEach((slide) => {
						slide.pause();
						slide.reset();
					});
					state.isPlaying = false;
					if (updateButtonState) updateButtonState();
				},
				reload: () => window.location.reload(),
				source: () => handleSourceCommand(data.source),
			};

			handlers[event]?.();
		};
	}

	return { createMessageHandler };
}
