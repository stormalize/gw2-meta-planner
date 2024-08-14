import Alpine from "alpinejs";
import persist from "alpinejs-persist";

Alpine.plugin(persist);

const data = await getDataJson("./data.json");

Alpine.data("gw2MetaPlanner", () => ({
	init() {
		this.$nextTick(() => {
			this.setupIntersectObserver();
			Alpine.store("global").toggleLoading();
		});

		// provide default for settings in case they are missing
		if (!"defaultEstimate" in this.settings) {
			this.settings.defaultEstimate = "avg";
		}

		this.metas = data.metas;
		this.unscheduledMetaForm.time = this.getLocalTime(0);
		let timezoneOffset = new Date().getTimezoneOffset();
		timezoneOffset = ((timezoneOffset > 0 ? -1 : 1) * timezoneOffset) / 60;
		this.timezoneOffsetForReset = timezoneOffset;
	},
	setupIntersectObserver() {
		const container = this.$refs.metasSection;

		const options = {
			root: container,
			rootMargin: "0px",
			threshold: [0, 0.25, 0.5, 0.75, 1],
		};

		if ("IntersectionObserver" in window) {
			let observer = new IntersectionObserver((changes, observer) => {
				this.metasScrollHandler(changes, observer);
			}, options);

			const firstItem = container.querySelector(
				".release:first-of-type > ul > .group:first-of-type"
			);
			const lastItem = container.querySelector(
				".release:last-of-type > ul > .group:last-of-type"
			);

			observer.observe(firstItem);
			observer.observe(lastItem);

			this.scrollObserver = observer;

			document.addEventListener("scroll", (event) => {
				this.groupTitleScrollHandler(event);
			});
		}
	},
	metasScrollHandler(changes, observer) {
		const container = this.$refs.metasSection;

		changes.forEach((change) => {
			if (change.target.closest(".release:first-of-type")) {
				if (!change.isIntersecting || change.intersectionRatio < 0.75) {
					container.classList.add("scroll-start");
				} else {
					container.classList.remove("scroll-start");
				}
			}

			if (change.target.closest(".release:last-of-type")) {
				if (!change.isIntersecting || change.intersectionRatio < 0.75) {
					container.classList.add("scroll-end");
				} else {
					container.classList.remove("scroll-end");
				}
			}
		});
	},
	groupTitleScrollHandler(event) {
		const groups = document.querySelectorAll(".group");

		Array.from(groups).forEach((el) => {
			const title = el.querySelector(":scope > .title");
			const position = el.getBoundingClientRect();
			if (position.y <= 0) {
				title.classList.add("scroll-stuck");
				title.style.top = position.y === 0 ? 0 : `${position.y * -1}px`;
			} else {
				title.classList.remove("scroll-stuck");
				title.style.top = "0";
			}
		});
	},
	test: "hey",
	toggleDarkMode() {
		this.isDarkMode = !this.isDarkMode;
	},
	timezoneOffsetForReset: 0,
	unscheduledMetaForm: {
		meta: 0,
		time: "00:00",
	},
	settings: Alpine.$persist({
		defaultEstimate: "avg",
	}),
	routes: Alpine.$persist([
		{ name: "Main", metas: [{ id: 1, time: 1, duration: 25, offset: 0 }] },
	]), // list of ids
	moveRoutes: "",
	moveMessage: "",
	get releases() {
		// skip unscheduled metas, i.e. with no times listed
		const sorted = this.metas.reduce((obj, meta) => {
			if (meta?.times.length === 0) {
				return obj;
			}
			if (meta.release in obj) {
				if (meta.group in obj[meta.release]) {
					obj[meta.release][meta.group] = [
						...obj[meta.release][meta.group],
						...this.generateMetaCopiesFromTimes(meta),
					];
				} else {
					obj[meta.release] = {
						...obj[meta.release],
						[`${meta.group}`]: this.generateMetaCopiesFromTimes(meta),
					};
				}
			} else {
				obj[meta.release] = {
					[`${meta.group}`]: this.generateMetaCopiesFromTimes(meta),
				};
			}
			return obj;
		}, {});
		// console.log(sorted);
		return sorted;
	},
	get unscheduledMetas() {
		const sorted = this.metas.reduce((obj, meta) => {
			// only include metas with no scheduled times
			if (meta?.times.length === 0) {
				if (meta.release in obj) {
					obj[meta.release] = [...obj[meta.release], meta];
				} else {
					obj[meta.release] = [meta];
				}
			}
			return obj;
		}, {});
		// console.log(sorted);
		return sorted;
	},
	findMetaById(id) {
		return this.metas.find((meta) => meta.id === id);
	},
	prepareImport() {
		let data = false;
		try {
			data = JSON.parse(this.moveRoutes);
		} catch (error) {
			this.moveMessage = "Invalid JSON format detected";
			return;
		}

		if (data) {
			const preparedData = data.map((route) => {
				return {
					name: route?.n || "Unknown",
					metas:
						"m" in route
							? route.m.map((meta) => {
									return {
										id: meta?.id || 0,
										time: meta?.t || 0,
										duration: meta?.d || 5,
										offset: meta?.o || 0,
									};
							  })
							: [],
				};
			});
			this.routes = preparedData;
			this.moveMessage = "";
			this.moveRoutes = "";
		}
	},
	prepareExport() {
		const out = this.routes.map((route) => {
			return {
				n: route.name,
				m: route.metas.map((meta) => {
					return {
						id: meta.id,
						t: Math.round(meta.time * 1000) / 1000,
						d: meta.duration,
						o: meta.offset,
					};
				}),
			};
		});
		this.moveRoutes = JSON.stringify(out);
	},
	prepareRouteMeta(routeMeta) {
		return (
			(typeof routeMeta.id === "number" && this.findMetaById(routeMeta.id)) || {
				id: false,
				release: "Unknown",
				name: "Unknown",
				group: "Unknown",
				waypoint: "???",
				times: [],
				min: 0,
				avg: 0,
				max: 0,
			}
		);
	},
	handleUnscheduledAdd(routeId) {
		const time = this.getResetOffsetFromTime(this.unscheduledMetaForm.time);
		this.addToRoute(routeId, this.unscheduledMetaForm.meta, time);
	},
	addToRoute(routeId, metaId, time) {
		const timeKey = this.settings?.defaultEstimate || "avg";

		const metas = this.routes[routeId].metas;
		const meta = this.findMetaById(metaId);
		const duration = meta[timeKey] || meta.max;

		const newLocalTime = this.getLocalTime(time, duration);
		if (newLocalTime) {
			this.unscheduledMetaForm.time = newLocalTime;
		}

		this.routes[routeId].metas = [
			...metas,
			{ id: metaId, time, duration, offset: 0 },
		];

		// console.log(this.routes);
	},
	resetMetaEstimate(routeId, number, meta) {
		const timeKey = this.settings?.defaultEstimate || "avg";
		const duration = meta[timeKey] || meta.max;

		const routeMeta = this.routes[routeId].metas[number];
		if (routeMeta) {
			routeMeta.duration = duration;
			routeMeta.offset = 0;
		}
	},
	removeFromRoute(routeId, number) {
		const route = this.routes[routeId];
		const newMetas = route.metas.filter((meta, i) => i !== number);
		route.metas = newMetas;
	},
	createRoute() {
		this.routes = [...this.routes, { name: "Name", metas: [] }];
	},
	removeRoute(routeId) {
		const newRoutes = this.routes.filter((route, i) => i !== routeId);
		this.routes = newRoutes;
	},
	isMetaInRoute(routeId, metaId, time) {
		const route = this.routes[routeId];
		return route
			? -1 !==
					route.metas.findIndex(
						(meta) => meta.id === metaId && meta.time === time
					)
			: false;
	},
	generateMetaCopiesFromTimes(meta) {
		let copies = [];
		meta.times.forEach((time) => {
			const copy = structuredClone(Alpine.raw(meta));
			copy.time = time;
			copies = [...copies, copy];
		});

		return copies;
	},
	generateRowNumberFromTime(time, offsetMinutes) {
		const offset = offsetMinutes ? Math.floor(offsetMinutes / 5) : 0;
		// time is managed in hours from reset
		const result = time * 12 + 1 + offset;
		return Math.round(result);
	},
	generateRowNumberFromMinutes(duration, roundUp = true) {
		// duration in minutes
		const rowNumber = roundUp
			? Math.ceil(duration / 5)
			: Math.floor(duration / 5);
		// rounded to nearest increment of 5 minutes
		return rowNumber >= 1 ? rowNumber : 1;
	},
	getMetaPositionStyles(m) {
		const rowEnd = this.generateRowNumberFromMinutes(m.duration, false);
		const endLeftovers = m.duration > 5 ? m.duration % 5 : 0;
		const startLeftovers = m.offset % 5;
		const styles = {
			gridRowStart: this.generateRowNumberFromTime(m.time, m.offset),
			gridRowEnd: `span ${rowEnd}`,
			marginBlockEnd: endLeftovers
				? `calc((var(--incr-5-min) + 0.25rem) / 5 * -${endLeftovers})`
				: null,
			top: startLeftovers
				? `calc((var(--incr-5-min) + 0.25rem) / 5 * ${startLeftovers})`
				: null,
		};
		return styles;
	},
	getResetOffsetFromTime(timestr) {
		const [hours, minutes, ...rest] = timestr.split(":");
		//round minutes to multiples of 5 and then divide by 60 to get hour fraction
		const hoursInt = Number(hours);
		const minutesInt = Number(minutes);
		const adjustedHours =
			this.timezoneOffsetForReset < 0
				? hoursInt - this.timezoneOffsetForReset
				: hoursInt + this.timezoneOffsetForReset;
		const total =
			(adjustedHours >= 24 ? adjustedHours - 24 : adjustedHours) +
			(Math.ceil(minutesInt / 5) * 5) / 60;
		return total;
	},
	getLocalTimeInMinutes(minutes) {
		return this.getLocalTime(minutes / 60);
	},
	getLocalTime(resetOffset, extraMin = false) {
		const extraMinutes = extraMin ? extraMin % 60 : 0;
		const extraHours = extraMin ? Math.floor(extraMin / 60) : 0;

		const minutes = Math.round((resetOffset % 1) * 60) + extraMinutes;
		const hours = Math.floor(resetOffset) + extraHours;

		const date = new Date();
		date.setUTCHours(hours, minutes, 0, 0);
		return `${String(date.getHours()).padStart(2, "0")}:${String(
			date.getMinutes()
		).padStart(2, "0")}`;
	},
	scrollObserver: null,
	metas: [],
}));

Alpine.store("global", {
	init() {
		this.isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
	},
	toggleDarkMode() {
		this.isDarkMode = !this.isDarkMode;
	},
	toggleLoading() {
		this.isLoading = !this.isLoading;
	},
	isDarkMode: false,
	isLoading: true,
	get bodyClasses() {
		return {
			"dark-mode": this.isDarkMode,
			loading: this.isLoading,
		};
	},
});

Alpine.start();

async function getDataJson(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		const json = await response.json();
		return json;
	} catch (error) {
		console.error(error.message);
	}
}

document.addEventListener("click", (event) => {
	if (event.target.closest("[x-text='meta.waypoint']"))
		window.getSelection().selectAllChildren(event.target);
});