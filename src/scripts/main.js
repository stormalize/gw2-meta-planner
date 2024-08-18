import { startClock } from "./modules/time.js";
import {
	selectors as routeSelectors,
	copyWaypointCode,
	saveRouteData,
	addEventItemToRoute,
	addCustomEventItemToRoute,
	removeEventItemFromRoute,
	adjustRouteItemOffset,
	adjustRouteItemDuration,
	resetTimesForRouteItem,
	toggleAltRouteItem,
} from "./modules/route.js";
import selectors from "./modules/selectors.js";
import { addUnscheduledEvent } from "./modules/toolbar.js";
import DATA from "./modules/data.js";

// selectors
const C_GRID = "mp-grid";

// main grid
const MAIN_GRID = document.querySelector(`.${C_GRID}`);

// helper function to keep preference updates in one spot
function setPref(key, value) {
	if (!key) {
		console.warn("Please specify a key for a pref to save");
		return;
	}

	switch (key) {
		case "enableAltRoute":
			if (value) {
				MAIN_GRID.classList.add(`${C_GRID}--alt-route`);
			} else {
				MAIN_GRID.classList.remove(`${C_GRID}--alt-route`);
			}
			break;

		case "defaultDuration":
			break;

		default:
			break;
	}

	// save value to key
	DATA[`pref_${key}`] = value;
}

// initialization stuff
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

function initializeRouteItemsFromData(data) {
	data.forEach((item) => {
		const isCustomEvent = item.id.startsWith("c");
		if (isCustomEvent) {
			const [idStr, startStr, ...rest] = item.id.split("-");
			const id = Number(idStr.replace("c", ""));
			const start = Number(startStr);
			addCustomEventItemToRoute(id, start, item.a, item.d, item.o, false);
		} else {
			const metaEventItem = document.getElementById(`event-${item.id}`);
			if (metaEventItem) {
				addEventItemToRoute(metaEventItem, item.a, item.d, item.o, false);
			} else {
				console.warn(
					`Event item with id '${item.id}' failed to load for current route data, could not locate in page.`
				);
			}
		}
	});
}

// event handlers
function handleRouteTimeControls(event) {
	if (!["offset", "duration"].includes(event.target.dataset.control)) {
		return;
	}

	const routeEventItem = event.target.closest(".mp-route.mp-event");
	if (routeEventItem) {
		if (event.target.dataset.control === "offset") {
			adjustRouteItemOffset(routeEventItem, event.target.value);
		} else if (event.target.dataset.control === "duration") {
			adjustRouteItemDuration(routeEventItem, event.target.value);
		}
		saveRouteData();
	}
}

function handleAddEventItemToRoute(event) {
	const actionEl = event.target.closest(
		`.${routeSelectors.c_event}__actions button`
	);

	if ("addtoroute" !== actionEl?.dataset.control) {
		return;
	}

	const metaEventItem = event.target.closest(`.${routeSelectors.c_event}`);
	if (metaEventItem) {
		const addAlt = event.target.closest(`.${C_GRID}__alt-item`) !== null;
		addEventItemToRoute(metaEventItem, addAlt);
	}
}

function handleRouteEventControls(event) {
	const supportedControls = [
		"removefromroute",
		"togglealtroute",
		"resetrouteitem",
	];

	const actionEl = event.target.closest(
		`.${routeSelectors.c_event}__actions button`
	);

	const action = actionEl?.dataset.control;

	if (!supportedControls.includes(action)) {
		return;
	}

	const routeItem = event.target.closest(`.${routeSelectors.c_route}`);

	if (routeItem) {
		switch (action) {
			case "removefromroute":
				removeEventItemFromRoute(routeItem);
				break;

			case "togglealtroute":
				toggleAltRouteItem(routeItem);
				break;

			case "resetrouteitem":
				resetTimesForRouteItem(routeItem);
				break;

			default:
				break;
		}
	}
}

function handleAltRouteToggle(event) {
	setPref("enableAltRoute", event.target.checked);
}

function handleDefaultDurationChange(event) {
	setPref("defaultDuration", event.target.value);
}

function handleUnscheduledEventTrigger(event) {
	addUnscheduledEvent();
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
	// prefs: alt route
	const altRouteInput = document.getElementById("pref-enable-alt-route");
	altRouteInput?.addEventListener("change", handleAltRouteToggle);
	// prefs: default duration
	const defaultDurationSelect = document.getElementById(
		selectors.id_prefDefaultDuration
	);
	defaultDurationSelect?.addEventListener(
		"change",
		handleDefaultDurationChange
	);
	// tools: add unscheduled event
	const addUnscheduledEventTrigger = document.getElementById(
		selectors.id_toolAddUnscheduledTrigger
	);
	addUnscheduledEventTrigger?.addEventListener(
		"click",
		handleUnscheduledEventTrigger
	);
}

function setup() {
	// check header height once, in case any groups have a long title
	const header = document.querySelector(".mp-header");
	const height = header.getBoundingClientRect().height;
	MAIN_GRID.style.setProperty("--mp-grid--header-height", `${height}px`);

	// read saved data and set up
	// prefs: alt route
	const altRouteInput = document.getElementById("pref-enable-alt-route");
	altRouteInput.checked = DATA.pref_enableAltRoute;
	if (DATA.pref_enableAltRoute) {
		MAIN_GRID.classList.add(`${C_GRID}--alt-route`);
	}
	// prefs: default duration
	const defaultDurationSelect = document.getElementById(
		selectors.id_prefDefaultDuration
	);
	defaultDurationSelect.value = DATA.pref_defaultDuration;

	// add check if reading from URL, skip loading from localStorage
	const urlParams = new URLSearchParams(window.location.search);
	const urlData = urlParams.get("d");
	if (urlData) {
		console.log(urlData);
	} else {
		initializeRouteItemsFromData(DATA.route);
	}

	registerEventListeners();
	startScrollIntersectObserver();

	startClock();
	MAIN_GRID.classList.remove(`${C_GRID}--loading`);
}

setup();
