export const getParamsFromUrl = (url) => {
	const urlObj = new URL(url, window.location.origin);
	const typeParam = urlObj.searchParams.get("type");
	let type = typeParam != null ? typeParam : "video";
	const masterParam = urlObj.searchParams.get("master");
	let isMaster = masterParam != null && masterParam == "true";
	return { type, isMaster: isMaster };
};
