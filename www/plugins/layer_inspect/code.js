function layer_inspect_callback(ret) {
  ret=ret.return_value;

  var inspect_div=basemaps.osb.div;
  var div=inspect_div.firstChild;

  while(div) {
    var imgs=div.getElementsByTagName("img");
    if(imgs.length&&div.layer_inspect) {
      var stat;
      if(stat=ret[imgs[0].src]) {
	dom_clean(div.layer_inspect);
	dom_create_append_text(div.layer_inspect, stat);
      }
    }

    div=div.nextSibling;
  }
}

function layer_inspect_view_changed() {
  var inspect_div=basemaps.osb.div;
  var div=inspect_div.firstChild;
  var new_tiles=[];

  while(div) {
    var src=null;
    var imgs=div.getElementsByTagName("img");
    if(imgs.length&&imgs[0].src) {
      src=imgs[0].src;

    if(!div.layer_inspect) {
      div.layer_inspect=dom_create_append(div, "div");
      div.layer_inspect.className="layer_inspect";
    }

    if(div.layer_inspect.src!=src) {
	div.layer_inspect.src=src;
	new_tiles.push(src);

	dom_clean(div.layer_inspect);
      }
    }

    div=div.nextSibling;
  }

  if(new_tiles.length) {
    ajax("layer_inspect", {}, json_encode(new_tiles), layer_inspect_callback);
  }
}

function layer_inspect_activate(input) {
  alert(input.checked);
}

function layer_inspect_init() {
  var dom=document.createElement("div");
  dom.className="layer_inspect_toolbox";

  var input=dom_create_append(dom, "input");
  input.type="checkbox";
  input.onchange=layer_inspect_activate.bind(this, input);
  
  dom_create_append_text(dom, lang("layer_inspect:name"));

  if(debug_toolbox_register) {
    debug_toolbox_register({
      weight: 0,
      dom: dom
    });
  }
}

register_hook("init", layer_inspect_init);
register_hook("view_changed_delay", layer_inspect_view_changed);