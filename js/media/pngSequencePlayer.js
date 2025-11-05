export const pngSequencePlayer = (container, isMaster) => {
	let element = null;
	let imagesArray = []; // Now stores URLs as strings
	let frameIndex = 0;
	let animationId = null;
	let isPlaying = false;
	const FPS = 25; // 24 frames per second
	const FRAME_DURATION = 1000 / FPS; // ~42ms per frame

	const create = () => {
		element = document.createElement("img");
		element.id = "png-sequence-player";
		element.style.width = "100%";
		// Disable image smoothing for better performance
		element.style.imageRendering = "auto";
		return element;
	};

	const getElement = () => {
		return element;
	};

	const setImages = (urls) => {
		// URLs are now just strings, not Image objects
		imagesArray = urls;
		if (imagesArray.length > 0 && element) {
			// Set first frame directly from URL string
			element.src = imagesArray[0];
		}
	};

	const play = () => {
		if (!element || imagesArray.length === 0 || isPlaying) {
			return;
		}

		isPlaying = true;
		let lastFrameTime = performance.now();

		const updateFrame = (currentTime) => {
			if (!isPlaying) return;

			const elapsed = currentTime - lastFrameTime;

			// Only update frame if enough time has passed
			if (elapsed >= FRAME_DURATION) {
				// Move to next frame (loop when reaching the end)
				frameIndex = (frameIndex + 1) % imagesArray.length;
				// URLs are now strings, set directly
				element.src = imagesArray[frameIndex];

				// Compensate for any overtime to maintain consistent fps
				lastFrameTime = currentTime - (elapsed % FRAME_DURATION);
			}

			animationId = requestAnimationFrame(updateFrame);
		};

		animationId = requestAnimationFrame(updateFrame);
	};

	const pause = () => {
		isPlaying = false;
		if (animationId) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}
	};

	const stop = () => {
		pause();
		frameIndex = 0;
		if (element && imagesArray.length > 0) {
			// URLs are strings, set directly
			element.src = imagesArray[0];
		}
	};

	const setCurrentTime = (time) => {
		// Calculate which frame should be displayed based on time
		// Assuming time is in seconds
		const targetFrame = Math.floor(time * FPS) % imagesArray.length;
		frameIndex = targetFrame;
		if (element && imagesArray.length > 0) {
			// URLs are strings, set directly
			element.src = imagesArray[frameIndex];
		}
	};

	const getCurrentTime = () => {
		// Return current playback time in seconds based on frame index
		if (imagesArray.length === 0) return 0;
		return frameIndex / FPS;
	};

	const getDuration = () => {
		// Return total duration in seconds
		if (imagesArray.length === 0) return 0;
		return imagesArray.length / FPS;
	};

	return {
		create,
		getElement,
		play,
		pause,
		stop,
		setCurrentTime,
		getCurrentTime,
		getDuration,
		setImages,
	};
};
