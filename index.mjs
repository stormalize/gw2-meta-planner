import Watcher from "watcher";
import {
	copyFileSync,
	writeFileSync,
	readFileSync,
	mkdirSync,
	existsSync,
} from "node:fs";
import * as url from "node:url";
import { exec } from "node:child_process";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

let initBuildComplete = false;

const watcher = new Watcher(
	"src",
	{
		recursive: true,
	},
	(event, targetPath, targetPathNext) => {
		const newPath = targetPath.replace("src", "public");

		if ("addDir" === event) {
			if (!existsSync(newPath)) {
				mkdirSync(newPath);
			}
			return;
		}

		const file = targetPath.split("/").slice(-1)[0];
		const type = file && file.includes(".") ? file.split(".").slice(-1)[0] : "";
		const name =
			file && file.includes(".") ? file.replace(/\.[^/.]+$/, "") : file;

		switch (type) {
			case "php":
			case "json":
				if ("add" === event) {
					if (initBuildComplete) {
						// skip the rest, no need to build multiple times on init
						return;
					} else {
						initBuildComplete = true;
					}
				}

				exec("php build.php", (error, stdout, stderr) => {
					if (error) {
						console.log(`error: ${error.message}`);
						return;
					}
					if (stderr) {
						console.log(stderr);
						return;
					}
					console.log(stdout);
				});
				break;

			case "css":
			case "js":
			case "svg":
			case "png":
				copyFileSync(targetPath, newPath);
				break;

			default:
				break;
		}
		console.log(`File ${targetPath}: ${event}`);
	}
);
