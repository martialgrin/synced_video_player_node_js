import SlideCard from "./SlideCard.js";
import { CONFIG } from "./CONFIG.js";

export function createSlideManager(state, scene, isMaster) {
	function createSlides(albumData) {
		albumData.forEach((album) => {
			const slide = new SlideCard(album, CONFIG, isMaster);
			scene.add(slide);
			state.slides.push(slide);
		});
	}

	function initializeSlides() {
		const initialIndex = Math.floor(state.numSlides / 2);

		state.slides.forEach((slide, i) => {
			slide.setBrightness(
				i === initialIndex
					? CONFIG.BRIGHTNESS_ACTIVE
					: CONFIG.BRIGHTNESS_INACTIVE
			);
			slide.pause();
		});

		return initialIndex;
	}

	return { createSlides, initializeSlides };
}
