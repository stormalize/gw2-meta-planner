// selectors
const EVENT = "mp-event";
const ROUTE = "mp-route";
const LINES = "mp-lines";

// main grid
const MAIN_GRID = document.querySelector(".mp-grid");

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
	}
}

function addEventItemToRoute(metaEventItem) {
	const newItem = metaEventItem.cloneNode(true);
	const id = `route-${newItem.id}`;
	const defaultDuration = Number(newItem.dataset.avg) || 0;

	newItem.id = id;
	newItem.classList.add(ROUTE.replace(".", ""));
	newItem.style.gridColumnStart = null;
	newItem.style.setProperty("--duration", defaultDuration);

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
}

function handleAddEventItemToRoute(event) {
	if ("addtoroute" !== event.target.dataset.control) {
		return;
	}

	const metaEventItem = event.target.closest(`.${EVENT}`);
	if (metaEventItem) {
		addEventItemToRoute(metaEventItem);
	}
}

function removeEventItemFromRoute(routeItem) {
	const eventId = routeItem?.id?.replace("route-", "");
	if (eventId) {
		const metaEventItem = document.getElementById(eventId);
		metaEventItem?.classList.remove(`${EVENT}--added`);
	}
	routeItem.remove();
}

function handleRemoveEventItemFromRoute(event) {
	if ("removefromroute" !== event.target.dataset.control) {
		return;
	}

	const routeItem = event.target.closest(`.${ROUTE}`);

	if (routeItem) {
		removeEventItemFromRoute(routeItem);
	}
}

function registerEventListeners() {
	// route items: time controls
	document.addEventListener("change", handleRouteTimeControls);
	document.addEventListener("click", handleAddEventItemToRoute);
	document.addEventListener("click", handleRemoveEventItemFromRoute);
}

function setup() {
	// check header height once, in case any groups have a long title
	const header = document.querySelector(".mp-header");
	const height = header.getBoundingClientRect().height;
	MAIN_GRID.style.setProperty("--mp-grid--header-height", `${height}px`);

	registerEventListeners();
	startScrollIntersectObserver();
}

// on load
// update times: look for [data-start] -- if .time update innertext, if .event update .event-time innertext

// event listeners:
// settings/controls
// events: offset, duration, waypoint copy, add to route, delete from route
// add warn if end time (offset + duration) is past (greater than) data-max

setup();
