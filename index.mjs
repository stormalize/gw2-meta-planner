import Watcher from "watcher";
import { copyFileSync, writeFileSync, readFileSync } from "node:fs";
import * as url from "node:url";
import { Eta } from "eta";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const eta = new Eta({ views: `${__dirname}src` });

const watcher = new Watcher("src", {}, (event, targetPath, targetPathNext) => {
	const file = targetPath.split("/").slice(-1)[0];
	const type = file && file.includes(".") ? file.split(".").slice(-1)[0] : "";
	const name =
		file && file.includes(".") ? file.replace(/\.[^/.]+$/, "") : file;

	switch (type) {
		case "eta":
			const data = JSON.parse(readFileSync("src/data.json"));
			const res = eta.render(name, data);
			writeFileSync(`${__dirname}dist/${name}.html`, res);
			break;

		case "css":
		case "js":
			copyFileSync(`${__dirname}src/${file}`, `${__dirname}dist/${file}`);
			break;

		case "json":
		default:
			break;
	}
	console.log(`File ${targetPath}: ${event}`);
});
