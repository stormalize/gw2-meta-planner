import Alpine from "alpinejs";

/**
 * TODO:
 *
 * 1. add importer parser -- support dropping a json file or url import, make sure to sanitize
 * 2. save state to local storage?
 * 3. Each data point in a section should have an individual "reroll" and "lock/unlock" button in the ui
 * 4. sections, instruments, etc. should have a lock as well
 * 5. button to duplicate any section as well as add a new one to end?
 */

Alpine.data("gw2MetaPlanner", () => ({
	init() {
		this.$nextTick(() => {
			this.setupIntersectObserver();
		});
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
	unscheduledMetaForm: {
		meta: null,
		time: "00:00",
	},
	routes: [{ name: "Demo", metas: [{ id: 1, time: 0.25, duration: 10 }] }], // list of ids
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
		console.log(sorted);
		return sorted;
	},
	findMetaById(id) {
		return this.metas.find((meta) => meta.id === id);
	},
	prepareRouteMeta(routeMeta) {
		return {
			...structuredClone(Alpine.raw(this.findMetaById(routeMeta.id))),
			...routeMeta,
		};
	},
	addToRoute(routeId, metaId, time) {
		const metas = this.routes[routeId].metas;
		const meta = this.findMetaById(metaId);
		const duration = meta?.average;

		this.routes[routeId].metas = [...metas, { id: metaId, time, duration }];

		console.log(this.routes);
	},
	resetMetaEstimate(routeId, number, avg) {
		const routeMeta = this.routes[routeId].metas[number];
		if (routeMeta) {
			routeMeta.duration = avg;
		}
	},
	removeFromRoute(routeId, number) {
		const route = this.routes[routeId];
		console.log(route.metas);
		const newMetas = route.metas.filter((meta, i) => i !== number);
		console.log(newMetas);
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
	generateRowNumberFromTime(time) {
		// time is managed in hours from reset
		return time * 12 + 1;
	},
	generateRowNumberFromMinutes(duration) {
		// duration in minutes
		// rounded up to nearest increment of 5 minutes
		return Math.ceil(duration / 5);
	},
	getLocalTimeInMinutes(minutes) {
		return this.getLocalTime(minutes / 60);
	},
	getLocalTime(resetOffset) {
		const minutes = (resetOffset % 1) * 60;
		const hours = Math.floor(resetOffset);

		const date = new Date();
		date.setUTCHours(hours, minutes, 0, 0);
		return `${String(date.getHours()).padStart(2, "0")}:${String(
			date.getMinutes()
		).padStart(2, "0")}`;
	},
	scrollObserver: null,
	metas: [
		{
			id: 1,
			release: "Core",
			name: "Triple Trouble (guild)",
			group: "World Bosses",
			waypoint: "[&BMIDAAA=]",
			type: "Boss",
			times: [], // relative to reset
			min: 5, // minutes
			average: 7,
			max: 10, // minutes
		},
		{
			id: 0,
			release: "Core",
			name: "The Shatterer",
			group: "World Bosses",
			waypoint: "[&BE4DAAA=]",
			type: "Boss",
			times: [1], // relative to reset
			min: 5, // minutes
			average: 10,
			max: 15, // minutes
		},
		{
			id: 1,
			release: "Core",
			name: "Svanir Shaman",
			group: "World Bosses",
			waypoint: "[&BMIDAAA=]",
			type: "Boss",
			times: [0.25, 2.25], // relative to reset
			min: 5, // minutes
			average: 7,
			max: 10, // minutes
		},
		{
			id: 2,
			release: "Season 1",
			name: "Twisted Marionette (Public)",
			group: "Eye of the North",
			waypoint: "[&BAkMAAA=]",
			type: "Boss",
			times: [0], // relative to reset
			min: 5, // minutes
			average: 10,
			max: 15, // minutes
		},
		{
			id: 3,
			release: "Heart of Thorns",
			name: "Octovine",
			group: "Auric Basin",
			waypoint: "[&BAIIAAA=]",
			type: "Boss",
			times: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23], // relative to reset
			min: 5, // minutes
			average: 15,
			max: 20, // minutes
		},
		{
			id: 4,
			release: "Heart of Thorns",
			name: "Chak Gerent",
			group: "Tangled Depths",
			waypoint: "[&BPUHAAA=]",
			type: "Boss",
			times: [
				0.5, 2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 18.5, 20.5, 22.5,
			], // relative to reset
			min: 15, // minutes
			average: 20,
			max: 25, // minutes
		},
		{
			id: 1,
			release: "Season 5",
			name: "Dragonstorm (private)",
			group: "Eye of the North",
			waypoint: "[&BMIDAAA=]",
			type: "Boss",
			times: [], // relative to reset
			min: 5, // minutes
			average: 7,
			max: 10, // minutes
		},
	],
}));

Alpine.store("global", {
	init() {
		this.isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
	},
	toggleDarkMode() {
		this.isDarkMode = !this.isDarkMode;
	},
	isDarkMode: false,
	get bodyClasses() {
		let classes = [];
		if (this.isDarkMode) {
			classes.push("dark-mode");
		}
		return classes || "";
	},
});

Alpine.start();
