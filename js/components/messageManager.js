export const messageManager = () => {
	let timeOut = null;
	const showMessage = (message) => {
		const messageContainer = document.getElementById("message-container");
		if (messageContainer) {
			console.log(message);
			const messageElement = document.createElement("div");
			messageElement.className = "message";
			messageElement.innerText = message;
			messageContainer.appendChild(messageElement);
			timeOut = setTimeout(() => {
				messageElement.remove();
			}, 3000);
			return;
		}
	};

	return { showMessage };
};
