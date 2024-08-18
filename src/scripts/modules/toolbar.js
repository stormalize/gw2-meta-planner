import { addCustomEventItemToRoute } from "./route.js";
import { getMinuteOffsetFromClockTime } from "./time.js";
import selectors from "./selectors.js";

function addUnscheduledEvent() {
	const eventSelectEl = document.getElementById(
		selectors.id_toolAddUnscheduledSelect
	);
	const eventTimeEl = document.getElementById(
		selectors.id_toolAddUnscheduledTime
	);

	if (!eventSelectEl || !eventTimeEl) {
		return;
	}

	const id = Number(eventSelectEl.value);
	const start = getMinuteOffsetFromClockTime(eventTimeEl.value);

	addCustomEventItemToRoute(id, start);
}

export { addUnscheduledEvent };
