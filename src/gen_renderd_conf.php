<?
function gen_renderd_conf() {
  global $root_path;
  global $lists_dir;

  $conf=fopen("$root_path/data/renderd.conf", "w");

  $template=file_get_contents("$root_path/src/renderd.conf.template");
  fwrite($conf, $template);

  $d=opendir("$lists_dir");
  while($f=readdir($d)) {
    if(preg_match("/(.*)\.xml$/", $f, $m)) {
      $recompile=false;

      if(!file_exists("$lists_dir/$f.renderd")) {
	$recompile=true;
      }
      else {
	$stat_xml=stat("$lists_dir/$f");
	$stat_renderd=stat("$lists_dir/$f.renderd");

	if($stat_xml['mtime']>$stat_renderd['mtime'])
	  $recompile=true;
      }

      if($recompile) {
	print "compiling $m[1]\n";
	$x=new category($m[1]);
	$x->compile();
      }

      $conf_part=file_get_contents("$lists_dir/$f.renderd");
      fwrite($conf, $conf_part);
    }
  }
  closedir($d);

  global $renderd_files;
  if($renderd_files) foreach($renderd_files as $file) {
    if(file_exists($file)) {
      fwrite($conf, file_get_contents($file));
    }
  }
  
  $renderd="";
  call_hooks("build_renderd", $renderd);

  // generate dummy entry in renderd.conf to avoid renderd-bug
  global $data_path;
  fwrite($conf, "[dummy]\n");
  fwrite($conf, "URI=/tiles/dummy/\n");
  fwrite($conf, "XML=/home/osm/data/render_dummy.xml\n");
  fwrite($conf, "HOST=dummy.host\n");

  fclose($conf);
}