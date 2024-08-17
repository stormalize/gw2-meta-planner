const selectors = {
	c_route: "mp-route",
	c_event: "mp-event",
	c_event_waypoint: "mp-event__waypoint",
};

async function copyWaypointCode(button) {
	const code = button.title.replace("Copy Waypoint ", "");
	try {
		await navigator.clipboard.writeText(code);
		button.dataset.toggletip = "Copied!";
		setTimeout(() => {
			delete button.dataset.toggletip;
		}, 1000);
	} catch (error) {
		console.warn("failed to copy waypoint code to clipboard");
	}
}

export { selectors, copyWaypointCode };
