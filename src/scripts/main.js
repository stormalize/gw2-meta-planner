import { startClock } from "./modules/time.js";
import { copyWaypointCode } from "./modules/route.js";

// selectors
const EVENT = "mp-event";
const ROUTE = "mp-route";
const LINES = "mp-lines";
const HEADER = "mp-header";
const GRID = "mp-grid";

// main grid
const MAIN_GRID = document.querySelector(".mp-grid");

// saved data
const data = {
	route: [],
	prefEnableAltRoute: false,
};

const supportedKeys = ["route", "prefEnableAltRoute"];

const dataProxy = {
	set(obj, prop, value) {
		if (supportedKeys.includes(prop)) {
			const success = Reflect.set(...arguments);
			if (success) {
				window.localStorage.setItem("mp__data", JSON.stringify(obj));
			}
			return success;
		} else {
			console.warn("invalid property on main data object");
		}
	},
};

const savedData = window.localStorage.getItem("mp__data");
if (savedData) {
	const savedObj = JSON.parse(savedData);
	Object.entries(savedObj).forEach(([key, value]) => {
		if (supportedKeys.includes(key)) {
			data[key] = value;
		}
	});
}

const DATA = new Proxy(data, dataProxy);
// end saved data

// live HTML collection of route items
const ROUTE_ITEMS_COLLECTION = MAIN_GRID.getElementsByClassName(ROUTE);

function saveRouteData() {
	const data = Array.from(ROUTE_ITEMS_COLLECTION).reduce((list, routeItem) => {
		// skip header items
		if (!routeItem.classList.contains(HEADER)) {
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
	const alt = routeItem.classList.contains(`${ROUTE}--alt`);

	return {
		id: id || null,
		o: offset || 0,
		d: duration || 0,
		a: alt,
	};
}

function startScrollIntersectObserver() {
	if ("IntersectionObserver" in window) {
		const intersectHandler = (changes, observer) => {
			changes.forEach((change) => {
				if (change.target.matches("[data-intersect='start']")) {
					if (!change.isIntersecting || change.intersectionRatio < 1) {
						MAIN_GRID.classList.add("scroll-start");
					} else {
						MAIN_GRID.classList.remove("scroll-start");
					}
				}

				if (change.target.matches("[data-intersect='end']")) {
					if (!change.isIntersecting || change.intersectionRatio < 1) {
						MAIN_GRID.classList.add("scroll-end");
					} else {
						MAIN_GRID.classList.remove("scroll-end");
					}
				}
			});
		};

		let observer = new IntersectionObserver(intersectHandler, {
			root: MAIN_GRID,
			rootMargin: "0px",
			threshold: [0, 0.25, 0.5, 0.75, 1],
		});

		const firstItem = MAIN_GRID.querySelector("[data-intersect='start']");
		const lastItem = MAIN_GRID.querySelector("[data-intersect='end']");

		observer.observe(firstItem);
		observer.observe(lastItem);
	}
}

function handleRouteTimeControls(event) {
	if (!["offset", "duration"].includes(event.target.dataset.control)) {
		return;
	}

	const routeEventItem = event.target.closest(".mp-route.mp-event");
	if (routeEventItem) {
		if (event.target.dataset.control === "offset") {
			if (event.target.value) {
				routeEventItem.style.setProperty("--offset", event.target.value);
				// add `warn` class if offset > data-max, update title with message
			} else {
				routeEventItem.style.removeProperty("--offset");
			}
		} else if (event.target.dataset.control === "duration") {
			if (event.target.value) {
				routeEventItem.style.setProperty("--duration", event.target.value);
				// add `warn` class if offset > data-max, update title with message
			} else {
				routeEventItem.style.removeProperty("--duration");
			}
		}
		saveRouteData();
	}
}

function addRouteData(data) {
	data.forEach((item) => {
		const metaEventItem = document.getElementById(`event-${item.id}`);
		if (metaEventItem) {
			addEventItemToRoute(metaEventItem, item.a, item.d, item.o, false);
		} else {
			console.warn(
				`Event item with id '${item.id}' failed to load for current route data, could not locate in page.`
			);
		}
	});
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
	const defaultDuration = duration || Number(newItem.dataset.avg) || 0;
	const defaultOffset = offset || 0;

	newItem.id = id;
	newItem.classList.add(ROUTE.replace(".", ""));
	newItem.style.gridColumnStart = null;
	newItem.style.setProperty("--duration", defaultDuration);
	if (alt) {
		newItem.classList.add(`${ROUTE}--alt`);
	}
	if (defaultOffset) {
		newItem.style.setProperty("--offset", defaultOffset);
	}

	// replace times content
	const timesContainer = newItem.querySelector(`.${EVENT}__times`);
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
	const actionsContainer = newItem.querySelector(`.${EVENT}__actions`);
	if (actionsContainer) {
		const template = document.getElementById("route-actions");
		const newActionsList = template?.content.cloneNode(true);
		if (newActionsList) {
			actionsContainer.replaceWith(newActionsList);
		}
	}

	const time1 = Number(newItem.dataset.start);
	const routeItems = document.querySelectorAll(`.${ROUTE}[data-start]`);
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
		const lines = document.querySelector(`.${LINES}`);
		lines?.before(newItem);
	}

	metaEventItem.classList.add(`${EVENT}--added`);

	if (save) {
		saveRouteData();
	}
}

function handleAddEventItemToRoute(event) {
	if ("addtoroute" !== event.target.dataset.control) {
		return;
	}

	const metaEventItem = event.target.closest(`.${EVENT}`);
	if (metaEventItem) {
		const addAlt = event.target.closest(`.${GRID}__alt-item`) !== null;
		addEventItemToRoute(metaEventItem, addAlt);
	}
}

function removeEventItemFromRoute(routeItem) {
	const eventId = routeItem?.id?.replace("route-", "");
	if (eventId) {
		const metaEventItem = document.getElementById(eventId);
		metaEventItem?.classList.remove(`${EVENT}--added`);
	}
	routeItem.remove();
	saveRouteData();
}

function toggleAltRouteItem(routeItem) {
	routeItem.classList.toggle(`${ROUTE}--alt`);
	saveRouteData();
}

function handleRouteEventControls(event) {
	const supportedControls = [
		"removefromroute",
		"togglealtroute",
		"resetrouteitem",
	];

	const action = event.target.dataset.control;

	if (!supportedControls.includes(action)) {
		return;
	}

	const routeItem = event.target.closest(`.${ROUTE}`);

	if (routeItem) {
		switch (action) {
			case "removefromroute":
				removeEventItemFromRoute(routeItem);
				break;

			case "togglealtroute":
				toggleAltRouteItem(routeItem);
				break;

			default:
				break;
		}
	}
}

function setPref(key, value) {
	if (!key) {
		console.warn("Please specify a key for a pref to save");
		return;
	}

	switch (key) {
		case "prefEnableAltRoute":
			if (value) {
				MAIN_GRID.classList.add(`${GRID}--alt-route`);
			} else {
				MAIN_GRID.classList.remove(`${GRID}--alt-route`);
			}
			break;

		default:
			break;
	}

	// save value to key
	DATA[key] = value;
}

function handleAltRouteToggle(event) {
	setPref("prefEnableAltRoute", event.target.checked);
}

function handleWaypointClick(event) {
	if ("waypointcopy" !== event.target.dataset.control) {
		return;
	}

	copyWaypointCode(event.target);
}

function registerEventListeners() {
	// event items: add to route
	document.addEventListener("click", handleAddEventItemToRoute);
	// route items: time controls
	document.addEventListener("change", handleRouteTimeControls);
	// route items: remove/swap/reset
	document.addEventListener("click", handleRouteEventControls);
	// route items: waypoint copy
	document.addEventListener("click", handleWaypointClick);
	// prefs:
	const altRouteInput = document.getElementById("pref-enable-alt-route");
	altRouteInput?.addEventListener("change", handleAltRouteToggle);
}

function setup() {
	// check header height once, in case any groups have a long title
	const header = document.querySelector(".mp-header");
	const height = header.getBoundingClientRect().height;
	MAIN_GRID.style.setProperty("--mp-grid--header-height", `${height}px`);

	// read saved data and set up
	const altRouteInput = document.getElementById("pref-enable-alt-route");
	altRouteInput.checked = DATA.prefEnableAltRoute;
	if (DATA.prefEnableAltRoute) {
		MAIN_GRID.classList.add(`${GRID}--alt-route`);
	}
	// add check if reading from URL, skip loading from localStorage
	addRouteData(DATA.route);

	registerEventListeners();
	startScrollIntersectObserver();

	startClock();
	MAIN_GRID.classList.remove(`${GRID}--loading`);
}

// on load
// update times: look for [data-start] -- if .time update innertext, if .event update .event-time innertext

// event listeners:
// settings/controls
// events: offset, duration, waypoint copy, add to route, delete from route
// add warn if end time (offset + duration) is past (greater than) data-max

setup();
