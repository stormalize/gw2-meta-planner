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
	<link rel="icon" href="./images/ancient-scroll.png">
	<title>GW2 Meta Planner</title>
</head>

<body>
	<div class="mp-hs-banner">
		<p>This project has been integrated into Hardstuck.gg. The newer version on Hardstuck has had a number of improvements made and will continue any other updates and iteration there &#8211; this version on GitHub pages is considered archived along with the original repo.</p>
		<p><a href="https://hardstuck.gg/gw2/meta-event-planner/">Meta-Event Planner on Hardstuck.gg<svg class="mp-icon mp-icon--inline" viewbox="0 0 24 24">
					<use href="./images/icon-library.svg#arrow-right"></use>
				</svg></a></p>
	</div>
	<header class="mp-site-header">
		<h1>GW2 Meta Planner</h1>
		<details class="mp-instructions">
			<summary>Instructions</summary>
			<div class="mp-instructions__content">
				<h2>How to Use</h2>
				<h3>Event Grid</h3>
				<ul>
					<li>Grid begins at daily reset, times are shown in your local time.</li>
					<li>Use the navigation to jump to a specific hour.</li>
					<li>Events are grouped together by map and release.</li>
					<li>For metas without a set timer or private instances that are started manually, use the <em>Add Unscheduled Event</em> in the toolbar.</li>
				</ul>
				<h3>Routes</h3>
				<ul>
					<li>
						By default events are added to the <svg class="mp-icon mp-icon--inline" viewbox="0 0 24 24">
							<use href="./images/icon-library.svg#star"></use>
						</svg> <strong>Primary</strong> route.
					</li>
					<li>A second <svg class="mp-icon mp-icon--inline" viewbox="0 0 24 24">
							<use href="./images/icon-library.svg#triangle"></use>
						</svg> <strong>Alternate</strong> route may be enabled that can be used for planning backup events in case events in the Primary route don't succeed, arrive too late, or anything else that could go wrong.
					</li>
					<li>
						Customize events in your route by adjusting the <em>Estimated duration (Est.)</em> for each event based on how quickly your group can complete it. Definitions of the provided times:
						<ul>
							<li>
								<strong>Minimum</strong>: large pre-made squad with boons doing
								high DPS.
							</li>
							<li>
								<strong>Average</strong>: regular map or a small pre-made squad
								mixed with randoms.
							</li>
							<li>
								<strong>Maximum</strong>: hard limit of the event, usually timers
								on the event chain that cause the event to fail if they run out.
							</li>
						</ul>
					</li>
					<li>The <em>Default Estimate</em> setting in the toolbar will change which preset estimate is used whenever you add a new event to a route.</li>
					<li>You can also adjust the <em>Delay Offset (Off.)</em> of an event in your route if you plan to finish up a previous event and then arrive late to the next one.</li>
					<li>
						Use the <em>Estimate</em> and <em>Offset</em> options for each event
						in your route to fine-tune events that might overwise overlap.
					</li>
				</ul>
				<h3>Import/Export</h3>
				<ul>
					<li>Your routes and settings are saved across page loads.</li>
					<li>In addition to saving locally, basic import and exporting of routes is
						supported. To save and share routes as a plain text string:
						<ol>
							<li>
								<strong>Export</strong>: Hit the "Export" button to
								generate a text string of your current route data, and save it
								somewhere like a text file.
							</li>
							<li>
								<strong>Import</strong>: Paste in a generated text string and hit
								"Import" to set up previously saved routes (note it will replace
								your existing route data that may have been saved in your browser storage).
							</li>
						</ol>
					</li>
				</ul>
			</div>
		</details>
	</header>
	<p id="loading-bar" class="mp-loading">Loading...</p>
	<div class="mp-layout">
		<div class="mp-toolbar">
			<div class="mp-toolbar__section">
				<svg class="mp-icon" viewbox="0 0 24 24">
					<use href="./images/icon-library.svg#scroll-arrows-swap-h"></use>
				</svg>
				<div class="mp-toolbar__content">
					<label class="mp-toolbar__label" for="tool-export-text">Export/Import Route Data</label>
					<div>
						<button id="tool-export-trigger">Export</button>
						<input type="text" id="tool-export-text" placeholder="paste import data here">
						<button id="tool-export-trigger-import">Import</button>
					</div>
				</div>
			</div>
			<div class="mp-toolbar__section">
				<svg class="mp-icon" viewbox="0 0 24 24">
					<use href="./images/icon-library.svg#star-triangle"></use>
				</svg>
				<div class="mp-toolbar__content">
					<label class="mp-toolbar__label" for="pref-enable-alt-route">Alternate Route</label>
					<div>
						<input type="checkbox" id="pref-enable-alt-route">
						<label for="pref-enable-alt-route">Enable</label>
					</div>
				</div>
			</div>
			<div class="mp-toolbar__section">
				<svg class="mp-icon" viewbox="0 0 24 24">
					<use href="./images/icon-library.svg#gauge"></use>
				</svg>
				<div class="mp-toolbar__content">
					<label class="mp-toolbar__label" for="pref-default-duration">Default Estimate</label>
					<select id="pref-default-duration">
						<option value="min">Minumum</option>
						<option selected="" value="avg">Average</option>
						<option value="max">Maximum</option>
					</select>
				</div>
			</div>
			<div class="mp-toolbar__section">
				<svg class="mp-icon" viewbox="0 0 24 24">
					<use href="./images/icon-library.svg#scroll-plus"></use>
				</svg>
				<div class="mp-toolbar__content">
					<label class="mp-toolbar__label" for="tool-unscheduled-add-select">Add Unscheduled Event</label>
					<div>
						<select id="tool-unscheduled-add-select">
							<?php foreach ($data['groups_unscheduled'] as $group_name => $group) { ?>
								<optgroup label="<?php echo $group_name; ?>">
									<?php foreach ($group as $key => $event) { ?>
										<option value="<?php echo $event['id']; ?>"><?php echo $event['name']; ?></option>
									<?php } ?>
								</optgroup>
							<?php } ?>
						</select>
						<label for="tool-unscheduled-add-time">Time</label>
						<input type="time" id="tool-unscheduled-add-time" value="00:00" step="300">
						<button id="tool-unscheduled-add-trigger">Add</button>
					</div>
				</div>
			</div>
		</div>
		<div class="mp-time-nav">
			<svg class="mp-icon" viewbox="0 0 24 24">
				<use href="./images/icon-library.svg#compass-marker"></use>
			</svg>
			<h2>Navigation</h2>
			<p>Jump to time:</p>
			<ul>
				<li class="mp-time-nav__current"><a href="#time-current">Current</a></li>
				<?php foreach ($data['hours'] as $hour => $minutes) { ?>
					<li<?php echo $hour === 0 ? ' class="mp-time-nav__reset"' : ''; ?>><a href="#time-<?php echo $minutes; ?>" data-start="<?php echo $minutes; ?>"><?php echo get_time_from_reset_offset($hour); ?></a></li>
					<?php } ?>
			</ul>
		</div>
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
	</div>
	<script type="module" src="./scripts/main.js"></script>
	<template id="route-time-controls">
		<ul class="mp-event__time-controls">
			<li>
				<label for="route-event-offset">Off.</label>
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
	<?php
	foreach ($data['groups_unscheduled'] as $group_name => $group) {
		foreach ($group as $key => $event) { ?>
			<template id="template-custom-event-<?php echo $event['id']; ?>">
				<div
					class="mp-event"
					data-min="<?php echo $event['min']; ?>"
					data-avg="<?php echo $event['avg']; ?>"
					data-max="<?php echo $event['max']; ?>"
					data-start="<?php echo $offset_minutes; ?>"
					data-release="<?php echo $group[0]['release']; ?>"
					id="custom-event-<?php echo $event['id']; ?>">
					<p class="mp-event__title"><?php echo $event['name']; ?></p>
					<p class="mp-event__start">00:00</p>
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
			</template>
	<?php }
	} ?>
</body>

</html>