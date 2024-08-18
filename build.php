<?php

$in_path  = __DIR__ . '/src';
$out_path = __DIR__ . '/public';

$assets = in_array('--assets', $argv, true);

if ($assets) {
	handle_assets();
}

function handle_assets()
{
	global $in_path, $out_path;

	// make public if it doesn't exist
	if (! is_dir($out_path)) {
		mkdir($out_path, 0755);
	}

	foreach (['scripts', 'images'] as $type) {
		$folder = $in_path . '/' . $type;
		$target = $out_path . '/' . $type;
		print "COPYING $folder to $target\n";
		xcopy($folder, $target);
	}

	// styles file
	return copy($in_path . '/style.css', $out_path . '/style.css');
}

function xcopy($source, $dest, $permissions = 0755)
{
	$sourceHash = hashDirectory($source);
	// Check for symlinks
	if (is_link($source)) {
		return symlink(readlink($source), $dest);
	}

	// Simple copy for a file
	if (is_file($source)) {
		return copy($source, $dest);
	}

	// Make destination directory
	if (!is_dir($dest)) {
		mkdir($dest, $permissions);
	}

	// Loop through the folder
	$dir = dir($source);
	while (false !== $entry = $dir->read()) {
		// Skip pointers
		if ($entry == '.' || $entry == '..') {
			continue;
		}

		// Deep copy directories
		if ($sourceHash != hashDirectory($source . "/" . $entry)) {
			xcopy("$source/$entry", "$dest/$entry", $permissions);
		}
	}

	// Clean up
	$dir->close();
	return true;
}

// In case of coping a directory inside itself, there is a need to hash check the directory otherwise and infinite loop of coping is generated
function hashDirectory($directory)
{
	if (! is_dir($directory)) {
		return false;
	}

	$files = array();
	$dir = dir($directory);

	while (false !== ($file = $dir->read())) {
		if ($file != '.' and $file != '..') {
			if (is_dir($directory . '/' . $file)) {
				$files[] = hashDirectory($directory . '/' . $file);
			} else {
				$files[] = md5_file($directory . '/' . $file);
			}
		}
	}

	$dir->close();

	return md5(implode('', $files));
}

function build_file($file_path)
{
	global $data;

	$output = NULL;
	if (file_exists($file_path)) {
		// Start output buffering
		ob_start();

		// Include the template file
		include $file_path;

		// End buffering and return its contents
		$output = ob_get_clean();
	}
	return $output;
}

function clean($path)
{
	echo "CLEANING HTML from $path\n";

	if (! file_exists($path)) {
		echo "CREATING output path $path\n";
		if (! mkdir($path, 0777, true)) {
			echo "ERROR: Couldn't create output directory $path\n";
			die();
		};
	}

	$html_files = glob($path . '/*.html');
	foreach ($html_files as $html_file) {
		echo "DELETING $html_file\n";
		unlink($html_file);
	}
}

function build()
{
	global $in_path, $out_path;

	clean($out_path);

	$files = glob($in_path . '/*.php');

	foreach ($files as $file) {
		$outfile = preg_replace('/\.php$/', '.html', str_replace($in_path, $out_path, $file));
		print "BUILDING $file to $outfile\n";
		$out = build_file($file, false);
		file_put_contents($outfile, $out);
	}
}

$event_data = json_decode(file_get_contents($in_path . '/data.json'), true);

$release_events = array();
$release_events_unscheduled = array();

foreach ($event_data['metas'] as $meta) {
	if ($meta['times']) {
		$release_events[$meta['group']][] = $meta;
	} else {
		$release_events_unscheduled[$meta['group']][] = $meta;
	}
}

$hours = array_fill(0, 24, "");

foreach ($hours as $key => $value) {
	$hours[$key] = $key * 60;
}

$data = array(
	'name' => 'THE YEAR OF GW2',
	'groups' => $release_events,
	'groups_unscheduled' => $release_events_unscheduled,
	'hours' => $hours,
);

build();
