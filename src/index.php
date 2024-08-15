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
		<li><a href="#route-event-0-0">First Item in Route</a></li>
		<li><a href="#time-0"></a>00:00</a></li>
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
		<li><a href="#time-720">12:00</a></li>
	</ul>
	<?php $group_col_total = count($data['groups']); ?>
	<div class="mp-grid mp-grid--alt-route" style="--mp-grid--group-col-count: <?php echo $group_col_total; ?>">
		<div class="mp-header mp-time">Time</div>
		<?php foreach ($clock_increments as $v) { ?>
			<p id="time-<?php echo $v['minutes']; ?>" class="mp-time" style="--time: <?php echo $v['minutes']; ?>">
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
						<button class="mp-event__waypoint" aria-label="copy waypoint code" title="Copy Waypoint <?php echo $event['waypoint']; ?>"></button>
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
								<button data-control="addtoroute" aria-label="add to route">Add 1</button>
							</li>
							<li class="mp-grid__alt-item">
								<button data-control="addtoroute" aria-label="add to alternate route">Add 2</button>
							</li>
						</ul>
					</div>
		<?php
				}
			}
			++$group_col_count;
		} ?>
		<div class="mp-header mp-route">Primary</div>
		<div class="mp-header mp-route mp-route--alt">Secondary</div>
		<p class="mp-event mp-route mp-route--alt" style="--time: 20">5</p>
		<div class="mp-lines"></div>
		<div class="mp-current" style="--time: 8">
			<div class="mp-clock">20:08</div>
		</div>
	</div>
	<script type="module" src="script.js"></script>
	<template id="route-time-controls">
		<ul class="mp-event__time-controls">
			<li>
				<label for="route-event-offset">Offset</label>
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
			<li><button data-control="removefromroute" aria-label="Remove from route">1</button></li>
			<li><button data-control="resetrouteitem" aria-label="Reset times">2</button></li>
			<li class="mp-grid__alt-item"><button data-control="swaproute" aria-label="Swap to other route">3</button></li>
		</ul>
	</template>
</body>

</html>