import gsap from "gsap";
import { CONFIG } from "./CONFIG.js";
import { calculateSlidePosition, calculateSlideRotation } from "./animation.js";

export function createCarouselController(state) {
	function updateSlideState(slide, isActive) {
		if (isActive) {
			if (state.isPlaying) slide.play();
			slide.setBrightness(CONFIG.BRIGHTNESS_ACTIVE);
		} else {
			slide.pause();
			slide.setBrightness(CONFIG.BRIGHTNESS_INACTIVE);
		}
	}

	function animateSlide(slide, position, rotationY) {
		gsap.to(slide.position, {
			x: position.x,
			z: -position.z,
			duration: CONFIG.ANIMATION_DURATION,
			ease: "expo.out",
			overwrite: true,
		});

		gsap.to(slide.rotation, {
			y: rotationY,
			duration: CONFIG.ROTATION_DURATION,
			ease: "expo.out",
			overwrite: true,
		});
	}

	function moveSlide(targetIndex) {
		if (state.currentSlideIndex === targetIndex) return;

		state.slides.forEach((slide, i) => {
			const offset = i - targetIndex;
			const position = calculateSlidePosition(offset);
			const rotation = calculateSlideRotation(offset);

			updateSlideState(slide, i === targetIndex);
			animateSlide(slide, position, rotation);
		});

		state.currentSlideIndex = targetIndex;
	}

	return { moveSlide };
}
