import {
	addCustomEventItemToRoute,
	clearRouteData,
	setRouteItemsFromData,
} from "./route.js";
import { getMinuteOffsetFromClockTime } from "./time.js";
import selectors from "./selectors.js";
import DATA from "./data.js";

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

function importData() {
	const input = document.getElementById(selectors.id_toolExportText);

	const str = input.value;

	const [first, second] = str.split("=");

	const version = second ? first : false;
	const data = second ? second : first;

	if (version) {
		// TODO: handle separate versions if needed
		const v = Number(version.replace("v"));

		const items = data.split("_").map((itemStr) => {
			const [id, offset, duration, isAlt, ...rest] = itemStr.split(":");

			if (!id) {
				return false;
			}

			return {
				id,
				o: Number(offset),
				d: Number(duration),
				a: isAlt === "1",
			};
		});

		clearRouteData();
		setRouteItemsFromData(items);
	} else {
		// no version number detected, support old prototype import
		let json = false;
		try {
			json = JSON.parse(data);
		} catch (error) {
			console.warn("Failed importing old plaintext JSON format.");
		}
		if (json) {
			// assuming route 1 = primary and 2 = alternate
			const [one, two, ...rest] = json;
			let newItems = [
				...one.m.map((obj) => {
					obj.a = false;
					return obj;
				}),
			];
			// mark items in two as alt
			if (two) {
				newItems = [
					...newItems,
					...two.m.map((obj) => {
						obj.a = true;
						return obj;
					}),
				];
			}

			newItems.sort((a, b) => a.t - b.t);

			// try to find new ids from real event items based on old time values
			const finalItems = newItems
				.map((item) => {
					let newId = false;
					const minutes = Math.round(item.t * 60);
					let existingItem = document.querySelector(
						`[id^='event-${item.id}'][data-start='${minutes}']`
					);
					delete item.t;
					if (!existingItem) {
						existingItem = document.getElementById(
							`template-custom-event-${item.id}`
						);
						if (existingItem) {
							// new custom event format
							newId = `c${item.id}-${minutes}`;
						}
					} else {
						newId = existingItem?.id
							? existingItem.id.replace("event-", "")
							: false;
					}
					item.id = newId;
					return item;
				})
				.filter((item) => item.id !== false);

			if (finalItems) {
				clearRouteData();
				setRouteItemsFromData(finalItems);
			}
		}
	}
}

function exportData() {
	const items = DATA.route.map((item) => {
		return `${item.id}:${item.o}:${item.d}:${item.a ? 1 : 0}`;
	});

	const str = items.join("_");

	const input = document.getElementById(selectors.id_toolExportText);

	input.value = `v2=${str}`;
}

export { addUnscheduledEvent, importData, exportData };
