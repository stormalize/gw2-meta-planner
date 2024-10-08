import { selectors as route_selectors } from "./route.js";
import selectorsMain from "./selectors.js";

export const selectors = {
	id_current: "time-current",
	id_clock: "clock",
	c_current: "mp_current",
	c_clock: "mp_clock",
	s_time: "[data-start]",
};

/**
 * Wrapper around setTimeout to be more accurate.
 * @param {CallableFunction} fn Function to run at every interval.
 * @param {number} time How often in milliseconds to run the function.
 * @returns {object}
 */
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

/**
 * Get total number of minutes from a string formatted as hh:mm.
 * @param {string} timeStr The time string.
 * @returns {number} Total minutes.
 */
function getMinuteOffsetFromClockTime(timeStr) {
	if (!timeStr) {
		return 0;
	}

	const date = new Date();

	const [hours, minutes, ...rest] = timeStr.split(":");

	date.setHours(Number(hours), Number(minutes), 0, 0);

	const utcHours = date.getUTCHours();
	const utcMinutes = date.getUTCMinutes();

	const total = utcHours * 60 + utcMinutes;
	return total;
}

/**
 * Updates main clock element, only on round minutes by default.
 * @param {boolean} forceUpdate Option to update even if not at a round minute.
 */
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

/**
 * Update all time elements in the page to local time.
 */
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

/**
 * Update main time input element for unschedule event form.
 */
function updateTimeInput() {
	const timeInput = document.getElementById(
		selectorsMain.id_toolAddUnscheduledTime
	);

	timeInput.value = getClockTimeFromOffset(0);
}

/**
 * Starts a clock that runs every second.
 * @returns {object}
 */
export function startClock() {
	const clockInterval = accurateInterval(() => {
		updateClockElement();
	}, 1000);
	return clockInterval;
}

updateClockElement(true);
updateTimeElements();
updateTimeInput();

export { getMinuteOffsetFromClockTime, getClockTimeFromOffset };
