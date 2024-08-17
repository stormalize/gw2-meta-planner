const selectors = {
	c_route: "mp-route",
	c_event: "mp-event",
	c_event_waypoint: "mp-event__waypoint",
};

async function copyWaypointCode(button) {
	const code = button.title.replace("Copy Waypoint ", "");
	try {
		await navigator.clipboard.writeText(code);
	} catch (error) {
		console.error(error.message);
	}
}

export { selectors, copyWaypointCode };
