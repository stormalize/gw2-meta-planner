import DATA from "./data.js";

const selectors = {
	c_route: "mp-route",
	c_event: "mp-event",
	c_event_waypoint: "mp-event__waypoint",
};

// main grid
const MAIN_GRID = document.querySelector(".mp-grid");

// live HTML collection of route items
const ROUTE_ITEMS_COLLECTION = MAIN_GRID.getElementsByClassName(
	selectors.c_route
);

function saveRouteData() {
	const data = Array.from(ROUTE_ITEMS_COLLECTION).reduce((list, routeItem) => {
		// skip header items
		if (!routeItem.classList.contains("mp-header")) {
			list.push(getRouteItemSaveData(routeItem));
		}
		return list;
	}, []);
	DATA.route = data;
}

function getRouteItemSaveData(routeItem) {
	const offsetEl = routeItem.querySelector("[data-control='offset']");
	const durationEl = routeItem.querySelector("[data-control='duration']");

	const id = routeItem.id?.replace("route-event-", "");
	const offset = Number(offsetEl?.value);
	const duration = Number(durationEl?.value);
	const alt = routeItem.classList.contains(`${selectors.c_route}--alt`);

	return {
		id: id || null,
		o: offset || 0,
		d: duration || 0,
		a: alt,
	};
}

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

function addEventItemToRoute(
	metaEventItem,
	alt = false,
	duration = false,
	offset = false,
	save = true
) {
	const newItem = metaEventItem.cloneNode(true);
	const id = `route-${newItem.id}`;
	const defaultDuration =
		duration || Number(newItem.dataset[DATA.pref_defaultDuration]) || 0;
	const defaultOffset = offset || 0;

	newItem.id = id;
	newItem.classList.add(selectors.c_route);
	newItem.style.gridColumnStart = null;
	newItem.style.setProperty("--duration", defaultDuration);
	if (alt) {
		newItem.classList.add(`${selectors.c_route}--alt`);
	}
	if (defaultOffset) {
		newItem.style.setProperty("--offset", defaultOffset);
	}

	if (defaultOffset >= Number(newItem.dataset.max)) {
		newItem.classList.add(`${selectors.c_event.replace(".", "")}--warning`);
		newItem.title = "Offset pushes event past its maximum duration!";
	}

	// replace times content
	const timesContainer = newItem.querySelector(`.${selectors.c_event}__times`);
	if (timesContainer) {
		const template = document.getElementById("route-time-controls");
		const controls = template?.content.cloneNode(true);
		if (controls) {
			["offset", "duration"].forEach((type) => {
				const label = controls.querySelector(`[for="route-event-${type}"]`);
				const input = controls.getElementById(`route-event-${type}`);

				label.htmlFor = `${id}-${type}`;
				input.id = `${id}-${type}`;

				if ("duration" === type) {
					input.value = defaultDuration;
				} else {
					input.value = defaultOffset;
				}
			});
			timesContainer.replaceChildren(controls);
		}
	}

	// replace actions
	const actionsContainer = newItem.querySelector(
		`.${selectors.c_event}__actions`
	);
	if (actionsContainer) {
		const template = document.getElementById("route-actions");
		const newActionsList = template?.content.cloneNode(true);
		if (newActionsList) {
			actionsContainer.replaceWith(newActionsList);
		}
	}

	const time1 = Number(newItem.dataset.start);
	const routeItems = document.querySelectorAll(
		`.${selectors.c_route}[data-start]`
	);
	const notInserted = Array.from(routeItems).every((element) => {
		const time2 = Number(element.dataset.start);
		if (time2 > time1) {
			element.before(newItem);
			return false;
		} else if (time2 === time1) {
			element.after(newItem);
			return false;
		}
		return true;
	});

	if (notInserted) {
		// insert at end
		const lines = document.querySelector(`.mp-lines`);
		lines?.before(newItem);
	}

	metaEventItem.classList.add(`${selectors.c_event}--added`);

	if (save) {
		saveRouteData();
	}
}

function removeEventItemFromRoute(routeItem) {
	const eventId = routeItem?.id?.replace("route-", "");
	if (eventId) {
		const metaEventItem = document.getElementById(eventId);
		metaEventItem?.classList.remove(`${selectors.c_event}--added`);
	}
	routeItem.remove();
	saveRouteData();
}

function adjustRouteItemOffset(routeItem, newOffset) {
	const warnClass = `${selectors.c_event.replace(".", "")}--warning`;

	if (newOffset) {
		routeItem.style.setProperty("--offset", newOffset);
		if (
			newOffset >= Number(routeItem.dataset.max) &&
			!routeItem.classList.contains(warnClass)
		) {
			routeItem.classList.add(warnClass);
			routeItem.title = "Offset pushes event past its maximum duration!";
		} else if (
			newOffset < Number(routeItem.dataset.max) &&
			routeItem.classList.contains(warnClass)
		) {
			routeItem.classList.remove(warnClass);
			routeItem.title = "";
		}
	} else {
		routeItem.style.removeProperty("--offset");
	}

	return newOffset;
}

function adjustRouteItemDuration(routeItem, newDuration = false) {
	const duration =
		newDuration || Number(routeItem.dataset[DATA.pref_defaultDuration]) || 0;
	routeItem.style.setProperty("--duration", duration);

	return duration;
}

function toggleAltRouteItem(routeItem) {
	routeItem.classList.toggle(`${selectors.c_route}--alt`);
	saveRouteData();
}

function resetTimesForRouteItem(routeItem) {
	const newOffset = adjustRouteItemOffset(routeItem, 0);
	const newDuration = adjustRouteItemDuration(routeItem);

	// update controls
	const offsetInput = routeItem.querySelector("[data-control='offset']");
	const durationInput = routeItem.querySelector("[data-control='duration']");
	offsetInput.value = newOffset;
	durationInput.value = newDuration;
	saveRouteData();
}

export {
	selectors,
	copyWaypointCode,
	saveRouteData,
	addEventItemToRoute,
	removeEventItemFromRoute,
	adjustRouteItemOffset,
	adjustRouteItemDuration,
	resetTimesForRouteItem,
	toggleAltRouteItem,
};
