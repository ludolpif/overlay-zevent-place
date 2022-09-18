<?php
/*
 * (ttn)zevent@piou:~$ ls
 * arc/  cron.php  postprocess.php  postprocess.sh  www/
 * (ttn)zevent@piou:~$ php postprocess.php > postprocess.sh
 * (ttn)zevent@piou:~$ vim postprocess.sh
 * (ttn)zevent@piou:~$ sh postprocess.sh
 * (ttn)zevent@piou:~$ ls
 * arc/  cron.php  postprocess/  postprocess.php  postprocess.sh  www/
 * (ttn)zevent@piou:~$ zip --symlinks -r www/zevent-place-2022-overlays-archives-postprocess.zip postprocess
 */
$srcdir = "arc";
$dstdir0 = "postprocess";
$dstdir1 = "postprocess/json";
$dstdir2 = "postprocess/img";

echo "mkdir $dstdir0\n";
echo "mkdir $dstdir1\n";
echo "mkdir $dstdir2\n";

is_dir($srcdir) or die("$srcdir is not dir\n");
$dh = opendir($srcdir);
if ( !$dh ) die ("Can't open dir $srcdir\n");
while (($file = readdir($dh)) !== false) {
	$path = "$srcdir/$file";
	switch (filetype($path)) {
	case 'dir':
		if ( $file == '.' || $file == '..' ) continue 2;
		process_png_dir($file);
		break;
	case 'file':
		$ext = pathinfo($path, PATHINFO_EXTENSION);
		if ( $ext != 'json' ) {
			echo "# ext unknown '$path'\n";
			continue 2;
		}
		echo "cp -a $path $dstdir1\n";
		break;
	default:
		echo "# type unknown: $file\n";
	}
}
closedir($dh);

function process_png_dir($pngdir) {
	global $srcdir;
	global $dstdir2;

	$prevpng = null;
	$prevpngfile = null;

	echo "mkdir $dstdir2/$pngdir\n";
	foreach (scandir("$srcdir/$pngdir", SCANDIR_SORT_ASCENDING) as $file) {
		if ( $file == '.' || $file == '..' ) continue;
		$arcpath = "$srcdir/$pngdir/$file";
		$ext = pathinfo($arcpath, PATHINFO_EXTENSION);
		if ( $ext != 'png' ) {
			echo "# ext unknown '$arcpath'\n";
			continue;
		}
		$png = file_get_contents($arcpath);
		if ( $prevpng !== $png ) {
			echo "cp -a $arcpath $dstdir2/$pngdir/$file\n";
			$prevpng = $png;
			$prevpngfile = $file;
		} else {
			echo "ln -s $prevpngfile $dstdir2/$pngdir/$file\n";
		}
	}
}
