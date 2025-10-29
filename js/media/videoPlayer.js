export const videoPlayer = (container, isMaster) => {
	let element = null;

	const create = () => {
		element = document.createElement("video");
		element.id = "video-player";
		element.style.width = "100%";
		element.controls = true;
		element.muted = isMaster ? false : true;
		element.playsinline = true;
		element.playsInline = true;
		element.webkitPlaysInline = true;
		element.loop = true;
		return element;
	};

	const getElement = () => {
		return element;
	};

	const play = () => {
		if (element) {
			element.play();
		}
	};

	const pause = () => {
		if (element) {
			element.pause();
		}
	};

	const stop = () => {
		if (element) {
			element.pause();
			element.currentTime = 0;
		}
	};

	const setCurrentTime = (time) => {
		if (element && element.duration && !isNaN(element.duration)) {
			// Handle looping: wrap time to video duration
			const wrappedTime = time % element.duration;
			element.currentTime = wrappedTime;
		}
	};

	const getCurrentTime = () => {
		if (element) {
			return element.currentTime || 0;
		}
		return 0;
	};

	const getDuration = () => {
		if (element && element.duration && !isNaN(element.duration)) {
			return element.duration;
		}
		return 0;
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
	};
};
