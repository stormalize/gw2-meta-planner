<?php

$in_path  = __DIR__ . '/src';
$out_path = __DIR__ . '/public';

$assets = in_array('--assets', $argv, true);

if ($assets) {
	handle_assets();
}

function handle_assets() {
	global $in_path, $out_path;
	
	foreach (['css', 'js'] as $type) {
		$files = glob($in_path . '/*.' . $type);
		foreach($files as $file) {
			$outfile = str_replace($in_path, $out_path, $file);
			print "COPYING $file to $outfile\n";
			copy($file, $outfile);
		}
	}
}

function build_file($file_path) {
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

function clean($path) {
	echo "CLEANING HTML from $path\n";

	if (! file_exists($path)) {
			echo "CREATING output path $path\n";
			if (! mkdir($path, 0777, true)) {
					echo "ERROR: Couldn't create output directory $path\n";
					die();
			};
	}

	$html_files = glob($path . '/*.html');
	foreach($html_files as $html_file) {
			echo "DELETING $html_file\n";
			unlink($html_file);
	}
}

function build() {
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
$data = array(
	'name' => 'THE YEAR OF GW2',
	'metas' => $event_data['metas'],
);

build();