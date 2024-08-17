import { selectors as route_selectors } from "./route.js";

export const selectors = {
	id_current: "time-current",
	id_clock: "clock",
	c_current: "mp_current",
	c_clock: "mp_clock",
	s_time: "[data-start]",
};

function accurateInterval(fn, time) {
	var cancel, nextAt, timeout, wrapper;
	nextAt = performance.now() + time;

	timeout = null;

	wrapper = function () {
		nextAt += time;
		timeout = setTimeout(wrapper, nextAt - performance.now());
		return fn();
	};
	cancel = function () {
		return clearTimeout(timeout);
	};
	timeout = setTimeout(wrapper, nextAt - performance.now());
	return {
		cancel: cancel,
	};
}

/**
 * Get current time formatted as 'hh:mm'.
 * @param {boolean|Array} [custom=false] Array of [0] hour and [1] minute numbers to use.
 * @returns {Array} [1] String value of 'hh:mm', [2] number value of seconds.
 */
function getClockTime(custom = false) {
	const date = new Date();

	if (custom) {
		const [hours, minutes] = custom;
		date.setUTCHours(hours, minutes, 0, 0);
	}

	return [
		`${String(date.getHours()).padStart(2, "0")}:${String(
			date.getMinutes()
		).padStart(2, "0")}`,
		date.getSeconds(),
	];
}

/**
 * Get total minutes from reset
 * @returns {number} Minutes since reset.
 */
function getMinutesFromReset() {
	const date = new Date();

	return date.getUTCHours() * 60 + date.getUTCMinutes();
}

/**
 * Get formatted string based on a given number of minutes past reset.
 * @param {number} offsetMinutes The total number of minutes to offset from reset.
 * @returns {string} Formatted string.
 */
function getClockTimeFromOffset(offsetMinutes) {
	const minutes = offsetMinutes ? offsetMinutes % 60 : 0;
	const hours = offsetMinutes ? Math.floor(offsetMinutes / 60) : 0;

	const [time, seconds] = getClockTime([hours, minutes]);
	return time;
}

function updateClockElement(forceUpdate = false) {
	const currentTimeEl = document.getElementById(selectors.id_current);
	const clockEl = document.getElementById(selectors.id_clock);
	if (currentTimeEl && clockEl) {
		const [timeStr, seconds] = getClockTime();
		if (forceUpdate || 0 === seconds) {
			clockEl.innerText = timeStr;
			currentTimeEl.style.setProperty("--time", getMinutesFromReset());
		}
	}
}

function updateTimeElements() {
	const timeEls = document.querySelectorAll(selectors.s_time);

	Array.from(timeEls).forEach((el) => {
		const target = el.classList.contains(`${route_selectors.c_event}`)
			? el.querySelector(`.${route_selectors.c_event}__start`)
			: el;

		if (target) {
			const offsetMin = Number(el.dataset.start);
			target.innerText = getClockTimeFromOffset(offsetMin);
		}
	});
}

export function startClock() {
	const clockInterval = accurateInterval(() => {
		updateClockElement();
	}, 1000);
	return clockInterval;
}

updateClockElement(true);
updateTimeElements();
