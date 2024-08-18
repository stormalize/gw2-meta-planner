// saved data
const data = {
	route: [],
	pref_enableAltRoute: false,
	pref_defaultDuration: "avg",
};

const supportedKeys = ["route", "pref_enableAltRoute", "pref_defaultDuration"];

// set up proxy to save to localstorage any time main data object is updated
const dataProxy = {
	set(obj, prop, value) {
		if (supportedKeys.includes(prop)) {
			if (
				prop === "pref_defaultDuration" &&
				!["min", "avg", "max"].includes(value)
			) {
				console.warn(`invalid value '${value}' provided for ${prop}`);
				return;
			}
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

// initialize data from localstorage
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

export default DATA;
