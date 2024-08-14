<?php
function get_min_from_reset_offset($offset)
{
	return $offset * 60;
}

function get_time_from_reset_offset($offset)
{
	$total = get_min_from_reset_offset($offset);
	$minutes = str_pad($total % 60, 2, "0", STR_PAD_LEFT);
	$hours = str_pad(floor($total / 60), 2, "0", STR_PAD_LEFT);
	return "{$hours}:{$minutes}";
}

$clock_increments = array_map(
	function ($i) {
		$offset = $i ? $i / 4 : $i;
		return array(
			'minutes' =>
			get_min_from_reset_offset($offset),
			'time' =>
			get_time_from_reset_offset($offset)
		);
		return $minutes;
	},
	array_keys(array_fill(0, 96, ''))
); ?>
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8" />
	<meta
		name="viewport"
		content="initial-scale=1.0, width=device-width, height=device-height, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<link href="style.css" rel="stylesheet" type="text/css" />
	<title>GW2 Meta Planner</title>
</head>

<body>
	<h1>GW2 Meta Planner</h1>
	<ul>
		<?php foreach (
			$data['metas'] as $release =>
			$group
		) { ?>
			<li>
				<?php echo $release; ?>
			</li>
		<?php } ?>
	</ul>

	<div class="mp-grid">
		<div class="mp-header mp-time">Time</div>
		<?php foreach ($clock_increments as $v) { ?>
			<p class="mp-time" style="--time: <?php echo $v['minutes']; ?>">
				<?php echo $v['time']; ?>
			</p>
		<?php } ?>
		<p></p>

		<p class="mp-header" data-intersect="start" style="grid-column-start: 2">
			A Lorem ipsum dolor Lorem ipsum dolor
		</p>
		<p class="mp-header" style="grid-column-start: 3">B</p>
		<p class="mp-header" style="grid-column-start: 4">C</p>
		<p class="mp-header" style="grid-column-start: 5">D</p>
		<p class="mp-header" style="grid-column-start: 6">E</p>
		<p class="mp-header" style="grid-column-start: 7">F</p>
		<p class="mp-header" style="grid-column-start: 8">G</p>
		<p class="mp-header" style="grid-column-start: 9">H</p>
		<p class="mp-header" style="grid-column-start: 10">I</p>
		<p class="mp-header" style="grid-column-start: 11">J</p>
		<p class="mp-header" style="grid-column-start: 12">K</p>
		<p class="mp-header" data-intersect="end" style="grid-column-start: 13">
			L
		</p>
		<p
			class="mp-event"
			id="event-2-0"
			style="--time: 0; grid-column-start: 3">
			1
		</p>
		<p
			class="mp-event"
			id="event-3-5"
			style="--time: 5; grid-column-start: 4">
			2
		</p>
		<p
			class="mp-event"
			id="event-4-10"
			style="--time: 10; grid-column-start: 6">
			3
		</p>
		<p
			class="mp-event"
			data-min="4"
			data-avg="6"
			data-max="10"
			data-start="15"
			style="--time: 15; grid-column-start: 3">
			Name
		</p>
		<p class="mp-event" style="--time: 20; grid-column-start: 6">5</p>
		<p class="mp-event" style="--time: 25; grid-column-start: 8">6</p>
		<p class="mp-event" style="--time: 30; grid-column-start: 2">7</p>
		<p class="mp-event" style="--time: 35; grid-column-start: 3">8</p>
		<p class="mp-event" style="--time: 40; grid-column-start: 5">9</p>
		<p class="mp-event" style="--time: 45; grid-column-start: 6">10</p>
		<p class="mp-event" style="--time: 50; grid-column-start: 8">11</p>
		<p class="mp-event" style="--time: 55; grid-column-start: 9">12</p>
		<p class="mp-event" style="--time: 60; grid-column-start: 3">13</p>
		<p class="mp-event" style="--time: 65; grid-column-start: 5">14</p>
		<p class="mp-event" style="--time: 70; grid-column-start: 4">15</p>
		<p class="mp-event" style="--time: 57; grid-column-start: 5">16</p>
		<div class="mp-header mp-route">Route</div>
		<p class="mp-event mp-route" style="--time: 0">
			<label for="route-event-1-0-offset">Offset</label>
			<input
				data-control="offset"
				id="route-event-1-0-offset"
				type="number"
				value="0"
				min="0" />
		</p>
		<p class="mp-event mp-route" style="--time: 13">2</p>
		<p class="mp-event mp-route" style="--time: 20">5</p>
		<p class="mp-event mp-route" style="--time: 30">6</p>
		<p class="mp-event mp-route" style="--time: 35">7</p>
		<p class="mp-event mp-route" style="--time: 40">8</p>
		<p class="mp-event mp-route" style="--time: 45">9</p>
		<p class="mp-event mp-route" style="--time: 50">10</p>
		<p class="mp-event mp-route" style="--time: 55">11</p>
		<p class="mp-event mp-route" style="--time: 65">12</p>
		<p class="mp-event mp-route" style="--time: 70">13</p>
		<p class="mp-event mp-route" style="--time: 75">14</p>
		<p class="mp-event mp-route" style="--time: 85">15</p>
		<p class="mp-event mp-route" style="--time: 90">16</p>
		<p class="mp-event mp-route" style="--time: 100">17</p>
		<p class="mp-event mp-route" style="--time: 115">18</p>
		<div class="mp-lines"></div>
		<div class="mp-current" style="--time: 8">
			<div class="mp-clock">20:08</div>
		</div>
	</div>
	<script>
		const header = document.querySelector(".mp-header");
		const height = header.getBoundingClientRect().height;
		const grid = document.querySelector(".mp-grid");
		grid.style.setProperty("--mp-grid-header-height", `${height}px`);

		if ("IntersectionObserver" in window) {
			const intersectHandler = (changes, observer) => {
				changes.forEach((change) => {
					if (change.target.matches("[data-intersect='start']")) {
						if (!change.isIntersecting || change.intersectionRatio < 1) {
							grid.classList.add("scroll-start");
						} else {
							grid.classList.remove("scroll-start");
						}
					}

					if (change.target.matches("[data-intersect='end']")) {
						if (!change.isIntersecting || change.intersectionRatio < 1) {
							grid.classList.add("scroll-end");
						} else {
							grid.classList.remove("scroll-end");
						}
					}
				});
			};

			let observer = new IntersectionObserver(intersectHandler, {
				root: grid,
				rootMargin: "0px",
				threshold: [0, 0.25, 0.5, 0.75, 1],
			});

			const firstItem = grid.querySelector("[data-intersect='start']");
			const lastItem = grid.querySelector("[data-intersect='end']");

			observer.observe(firstItem);
			observer.observe(lastItem);
		}

		// offset control
		document.addEventListener("change", (event) => {
			if (event.target.matches("[data-control='offset']")) {
				const routeEvent = event.target.closest(".mp-route.mp-event");
				if (routeEvent) {
					if (event.target.value) {
						routeEvent.style.setProperty("--offset", event.target.value);
						// add `warn` class if offset > data-max, update title with message
					} else {
						routeEvent.style.removeProperty("--offset");
					}
				}
			}
		});

		// on load
		// update times: look for [data-start] -- if .time update innertext, if .event update .event-time innertext

		// event listeners:
		// settings/controls
		// events: offset, duration, waypoint copy, add to route, delete from route
		// add warn if end time (offset + duration) is past (greater than) data-max
	</script>
</body>

</html>