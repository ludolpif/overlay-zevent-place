<?php
$date=date("Ymd-His");

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://timeforzevent.fr/overlay.json");
curl_setopt($ch, CURLOPT_AUTOREFERER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if ( curl_errno($ch) || ( $httpcode != 200 )) {
	die(
		date("Ymd-His")
		. " httpcode:$httpcode "
		. curl_error($ch)
		. "\n"
	);
}
$content = json_decode($result, true);
if ( $content === null || count($content) < 1 ) {
	die(
		date("Ymd-His")
		. " json_decode fail. count:".count($content)
		. "\n"
	);
}

file_put_contents("www/overlay-new.json", json_encode($content)) or die(
	date("Ymd-His")
	. "save failed\n"
);
$result_code=-1;
system("diff -q www/overlay-new.json www/overlay.json", $result_code);
switch ( $result_code ) {
case 0: // Les fichiers sont identiques
	break;
case 1: // Les fichiers sont differents
	rename("www/overlay.json", "arc/overlay-$date.json") or die(
		date("Ymd-His")
		. " rename2 failed\n"
	);
	rename("www/overlay-new.json", "www/overlay.json") or die(
		date("Ymd-His")
		. " rename2 failed\n"
	);
	break;
case 2: // Le fichier overlay.json est absent
	rename("www/overlay-new.json", "www/overlay.json") or die(
		date("Ymd-His")
		. " rename2 failed\n"
	);
	break;
default:
	echo "DEBUG : diff result_code:\n";
       	var_dump($result_code);
}

foreach ($content as $key => $data) {
	if ( preg_match('/^[A-Za-z0-9-]+$/', $key) !== 1 ) {
		echo date("Ymd-His") . " invalid key '$key'\n";
		continue;
	}
	if ( !isset($data['overlay_url']) ) {
		echo date("Ymd-His") . "  no overlay_url key '$key'\n";
		continue;
	}
	$url = $data['overlay_url'];
	if ( preg_match('/^https?:\/\/[A-Za-z0-9\/_.-]+.png$/', $url) !== 1 ) {
		echo date("Ymd-His") . "  bad overlay_url '$url' key '$key'\n";
		continue;
	}
	$dir = "arc/$key";
	if ( !is_dir($dir) ) mkdir($dir);
	curl_setopt($ch, CURLOPT_URL, $url);

	$result = curl_exec($ch);
	$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	if ( curl_errno($ch) || ( $httpcode != 200 )) {
		echo
			date("Ymd-His")
			. " url: $url httpcode:$httpcode "
			. curl_error($ch)
			. "\n"
		;
	}
	file_put_contents("$dir/$date.png", $result);
}
