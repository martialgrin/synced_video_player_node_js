export const getParamsFromUrl = (url) => {
	const urlObj = new URL(url, window.location.origin);

	// Type: video or pngSequence
	const typeParam = urlObj.searchParams.get("type");
	let type = typeParam != null ? typeParam : "video"; // Default to pngSequence now

	// Master flag
	const masterParam = urlObj.searchParams.get("master");
	let isMaster = masterParam != null && masterParam == "true";

	// Project name (e.g., "test-cavalry-project")
	const project = urlObj.searchParams.get("project");

	// Media type (e.g., "poster", "phone", "billboard", "album/1")
	const media = urlObj.searchParams.get("media");

	// Or combined source (e.g., "test-cavalry-project/poster")
	const source = urlObj.searchParams.get("source");

	// Build the source string
	let mediaSource = null;
	if (source) {
		// Use source directly if provided
		mediaSource = source;
	} else if (project && media) {
		// Build from project + media
		mediaSource = `${project}/${media}`;
	} else if (project) {
		// Just project, default to poster
		mediaSource = `${project}/poster`;
	}

	return {
		type,
		isMaster: isMaster,
		project,
		media,
		source: mediaSource,
	};
};
