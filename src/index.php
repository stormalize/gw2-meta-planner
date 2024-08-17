<?php
function get_min_from_reset_offset($offset)
{
	return round($offset * 60);
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
	<p>Jump to time:</p>
	<ul>
		<li><a href="#time-current">Current Time</a></li>
		<li><a href="#route-event-0-0">First Item in Route</a></li>
		<li><a href="#time-0" data-start="0">00:00</a></li>
		<li>01:00</li>
		<li>02:00</li>
		<li>03:00</li>
		<li>04:00</li>
		<li>05:00</li>
		<li>06:00</li>
		<li>07:00</li>
		<li>08:00</li>
		<li>09:00</li>
		<li>10:00</li>
		<li>11:00</li>
		<li><a href="#time-720" data-start="720">12:00</a></li>
	</ul>
	<label for="pref-enable-alt-route">Enable Alternate Route</label>
	<input type="checkbox" id="pref-enable-alt-route">
	<label for="pref-default-duration">Default Estimate</label>
	<select id="pref-default-duration">
		<option value="min">Minumum</option>
		<option selected="" value="avg">Average</option>
		<option value="max">Maximum</option>
	</select>
	<?php $group_col_total = count($data['groups']); ?>
	<div class="mp-grid mp-grid--loading" style="--mp-grid--group-col-count: <?php echo $group_col_total; ?>">
		<div class="mp-header mp-time">Time</div>
		<?php foreach ($clock_increments as $v) { ?>
			<p id="time-<?php echo $v['minutes']; ?>" class="mp-time" data-start="<?php echo $v['minutes']; ?>" style="--time: <?php echo $v['minutes']; ?>">
				<?php echo $v['time']; ?>
			</p>
		<?php }
		$group_col_count = 2;
		$first_group = array_key_first($data['groups']);
		$last_group = array_key_last($data['groups']);
		foreach ($data['groups'] as $group_name => $group) { ?>
			<p
				class="mp-header"
				data-release="<?php echo $group[0]['release']; ?>"
				<?php echo $first_group === $group_name ? ' data-intersect="start"' : '' ?>
				<?php echo $last_group === $group_name ? ' data-intersect="end"' : '' ?>
				style="grid-column-start: <?php echo $group_col_count; ?>">
				<?php echo $group_name; ?>
			</p>
			<?php foreach ($group as $key => $event) { ?>
				<?php foreach ($event['times'] as $instance => $time_offset) {
					$offset_minutes = get_min_from_reset_offset($time_offset);
				?>
					<div
						class="mp-event"
						data-min="<?php echo $event['min']; ?>"
						data-avg="<?php echo $event['avg']; ?>"
						data-max="<?php echo $event['max']; ?>"
						data-start="<?php echo $offset_minutes; ?>"
						data-release="<?php echo $group[0]['release']; ?>"
						id="event-<?php echo $event['id']; ?>-<?php echo $instance; ?>"
						style="
						--time: <?php echo $offset_minutes; ?>;
						--duration: <?php echo $event['max']; ?>;
						grid-column-start: <?php echo $group_col_count; ?>
					">
						<p class="mp-event__title"><?php echo $event['name']; ?></p>
						<p class="mp-event__start"><?php echo get_time_from_reset_offset($time_offset); ?></p>
						<button class="mp-event__waypoint" data-control="waypointcopy" aria-label="copy waypoint code" title="Copy Waypoint <?php echo $event['waypoint']; ?>"></button>
						<div class="mp-event__times">
							<dl class="mp-event__durations">
								<div>

									<dt>Min</dt>
									<dd><?php echo $event['min']; ?></dd>
								</div>
								<div>
									<dt>Avg</dt>
									<dd><?php echo $event['avg']; ?></dd>
								</div>
								<div>
									<dt>Max</dt>
									<dd><?php echo $event['max']; ?></dd>
								</div>
							</dl>
						</div>
						<ul class="mp-event__actions">
							<li>
								<button data-control="addtoroute" aria-label="add to primary route" title="Add to Primary route">
									<svg class="mp-icon" viewbox="0 0 24 24">
										<use href="./images/icon-library.svg#star-plus"></use>
									</svg>
								</button>
							</li>
							<li class="mp-grid__alt-item">
								<button data-control="addtoroute" aria-label="add to alternate route" title="Add to Alternate route">
									<svg class="mp-icon" viewbox="0 0 24 24">
										<use href="./images/icon-library.svg#triangle-plus"></use>
									</svg>
								</button>
							</li>
						</ul>
					</div>
		<?php
				}
			}
			++$group_col_count;
		} ?>
		<div class="mp-header mp-route">
			<svg class="mp-icon mp-icon--inline" viewbox="0 0 24 24">
				<use href="./images/icon-library.svg#star"></use>
			</svg>
			<span class="mp-grid__alt-item">Primary </span>Route
		</div>
		<div class="mp-header mp-route mp-route--alt">
			<svg class="mp-icon mp-icon--inline" viewbox="0 0 24 24">
				<use href="./images/icon-library.svg#triangle"></use>
			</svg>
			Alternate Route
		</div>
		<div class="mp-lines"></div>
		<div id="time-current" class="mp-current" style="--time: 0">
			<div id="clock" class="mp-clock">00:00</div>
		</div>
	</div>
	<script type="module" src="./scripts/main.js"></script>
	<template id="route-time-controls">
		<ul class="mp-event__time-controls">
			<li>
				<label for="route-event-offset">Delay</label>
				<input
					data-control="offset"
					id="route-event-offset"
					type="number"
					value="0"
					min="0" />
			</li>
			<li>
				<label for="route-event-duration">Est.</label>
				<input
					data-control="duration"
					id="route-event-duration"
					type="number"
					min="0" />
			</li>
		</ul>
	</template>
	<template id="route-actions">
		<ul class="mp-event__actions">
			<li><button data-control="removefromroute" aria-label="Remove from route" title="Remove from route">
					<svg class="mp-icon" viewbox="0 0 24 24">
						<use href="./images/icon-library.svg#trash"></use>
					</svg>
				</button></li>
			<li><button data-control="resetrouteitem" aria-label="Reset times" title="Reset offset and estimate to default">
					<svg class="mp-icon" viewbox="0 0 24 24">
						<use href="./images/icon-library.svg#clock-reset"></use>
					</svg>
				</button></li>
			<li class="mp-grid__alt-item"><button data-control="togglealtroute" aria-label="Swap to other route" title="Swap Event to Other Route Option">
					<svg class="mp-icon" viewbox="0 0 24 24">
						<use href="./images/icon-library.svg#arrows-swap-h"></use>
					</svg>
				</button></li>
		</ul>
	</template>
</body>

</html>