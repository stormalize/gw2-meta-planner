import DATA from "./data.js";
import selectorsMain from "./selectors.js";
import { getClockTimeFromOffset } from "./time.js";

/**
 * @typedef {object} RouteItemData
 * @property {string} id - Unique identifier to find the event item in the page.
 * @property {number} o - Offset in minutes.
 * @property {number} d - Duration in minutes.
 * @property {boolean} a - Flag for whether this is part of the "alt" route.
 */

const selectors = {
	c_route: "mp-route",
	c_event: "mp-event",
	c_event_waypoint: "mp-event__waypoint",
};

// main grid
const MAIN_GRID = document.querySelector(".mp-grid");

// live HTML collection of route items
/**
 * @type {HTMLAllCollection}
 */
const ROUTE_ITEMS_COLLECTION = MAIN_GRID.getElementsByClassName(
	selectors.c_route
);

/**
 * Save route data to main data object
 */
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

/**
 * Clear all route data from HTML and main data object
 */
function clearRouteData() {
	Array.from(ROUTE_ITEMS_COLLECTION).forEach((routeItem) => {
		// skip header items
		if (!routeItem.classList.contains("mp-header")) {
			removeEventItemFromRoute(routeItem);
		}
	});
	DATA.route = [];
}

/**
 * Set up route items from a list, optionally saving (initial page loading reads from main data object so we do not need to save)
 * @param {Array.<RouteItemData>} data List of objects
 * @param {boolean} [save=true] Whether to save to the main data object
 */
function setRouteItemsFromData(data, save = true) {
	let enableAltRoute = false;
	const addedIds = [];
	data.forEach((item) => {
		if (!enableAltRoute && item.a) {
			enableAltRoute = true;
		}
		const isCustomEvent = item.id.startsWith("c");
		if (isCustomEvent) {
			const [idStr, startStr, ...rest] = item.id.split("-");
			const id = Number(idStr.replace("c", ""));
			const start = Number(startStr);
			addCustomEventItemToRoute(id, start, item.a, item.d, item.o, save);
		} else {
			if (addedIds.includes(item.id)) {
				console.warn(
					`Duplicate item with id ${item.id} detected in import, skipping.`
				);
			} else {
				const metaEventItem = document.getElementById(`event-${item.id}`);
				if (metaEventItem) {
					addEventItemToRoute(metaEventItem, item.a, item.d, item.o, save);
				} else {
					console.warn(
						`Event item with id '${item.id}' failed to load for current route data, could not locate in page.`
					);
				}
				addedIds.push(item.id);
			}
		}
	});

	if (enableAltRoute) {
		const checkbox = document.getElementById(
			selectorsMain.id_prefEnableAltRoute
		);
		checkbox.checked = true;
		const evt = new Event("change", { bubbles: true });
		checkbox.dispatchEvent(evt);
	}
}

/**
 * Generate minimized object to save to main data and/or include in export string.
 * @param {Element} routeItem
 * @returns {RouteItemData}
 */
function getRouteItemSaveData(routeItem) {
	const offsetEl = routeItem.querySelector("[data-control='offset']");
	const durationEl = routeItem.querySelector("[data-control='duration']");

	const id = routeItem.classList.contains(`${selectors.c_event}--custom`)
		? routeItem.id?.replace("route-custom-event-", "c")
		: routeItem.id?.replace("route-event-", "");
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

/**
 * Trigger copy action for waypoint code.
 * @param {Element} button the button that was clicked.
 */
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

/**
 * Clone event element from main list, add route data to markup and place into HTML with other route items.
 * @param {Element} metaEventItem Target item that is to be added.
 * @param {boolean} alt Whether this item should have a class added to position in the alt layout column.
 * @param {number} duration Optional duration that should be set
 * @param {number} offset Optional offset that should be set
 * @param {boolean} save Whether to save to main data object
 */
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

		const timeInput = document.getElementById(
			selectorsMain.id_toolAddUnscheduledTime
		);
		// update add form to default to end time of event we just added
		timeInput.value = getClockTimeFromOffset(time1 + defaultDuration);
	}
}

/**
 * Handle custom events -- clone event element from template and configure and then call regular add event function.
 * @param {string} id Target item that is to be added, used to find template.
 * @param {number} start Custom start time for new item.
 * @param {boolean} alt Whether this item should have a class added to position in the alt layout column.
 * @param {number} duration Optional duration that should be set
 * @param {number} offset Optional offset that should be set
 * @param {boolean} save Whether to save to main data object
 */
function addCustomEventItemToRoute(
	id,
	start,
	alt = false,
	duration = false,
	offset = false,
	save = true
) {
	const template = document.getElementById(`template-custom-event-${id}`);
	const content = template?.content.cloneNode(true);
	const newItem = content.querySelector(`.${selectors.c_event}`) || false;

	// set start time
	newItem.dataset.start = start;
	newItem.style.setProperty("--time", start);
	newItem.id = `${newItem.id}-${start}`;
	newItem.classList.add(`${selectors.c_event}--custom`);

	addEventItemToRoute(newItem, alt, duration, offset, save);
}

/**
 * Remove a route item from the grid and update the main data object.
 * @param {Element} routeItem Route item to remove from main grid.
 */
function removeEventItemFromRoute(routeItem) {
	const eventId = routeItem?.id?.replace("route-", "");
	if (eventId) {
		const metaEventItem = document.getElementById(eventId);
		metaEventItem?.classList.remove(`${selectors.c_event}--added`);
	}
	routeItem.remove();
	saveRouteData();
}

/**
 * @param {Element} routeItem Item to adjust.
 * @param {number} newOffset Updated offset.
 * @returns {number} Pass along newOffset.
 */
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

/**
 * Simply toggles a class to position route item into second route column in grid.
 * @param {Element} routeItem Item to toggle to alt route.
 */
function toggleAltRouteItem(routeItem) {
	routeItem.classList.toggle(`${selectors.c_route}--alt`);
	saveRouteData();
}

/**
 * Reset both offset and duration times for a route item, and updates main data object.
 * @param {Element} routeItem Item to reset.
 */
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
	clearRouteData,
	addEventItemToRoute,
	addCustomEventItemToRoute,
	removeEventItemFromRoute,
	adjustRouteItemOffset,
	adjustRouteItemDuration,
	resetTimesForRouteItem,
	toggleAltRouteItem,
	setRouteItemsFromData,
};
