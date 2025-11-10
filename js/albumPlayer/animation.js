import { CONFIG } from "./CONFIG.js";
export function calculateSlidePosition(offset) {
	const x = CONFIG.SLIDE_SPACING_X * offset;
	let adjustedX = x;
	let z = 0;

	if (offset < 0) {
		adjustedX -= CONFIG.PLANE_WIDTH * CONFIG.SLIDE_OFFSET_FACTOR;
		z = CONFIG.PLANE_WIDTH;
	} else if (offset > 0) {
		adjustedX += CONFIG.PLANE_WIDTH * CONFIG.SLIDE_OFFSET_FACTOR;
		z = CONFIG.PLANE_WIDTH;
	}

	return { x: adjustedX, z };
}

export function calculateSlideRotation(offset) {
	if (offset < 0) return CONFIG.SLIDE_ROTATION;
	if (offset > 0) return -CONFIG.SLIDE_ROTATION;
	return 0;
}
