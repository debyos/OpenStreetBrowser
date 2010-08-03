var category_root;

function _category_list() {
  this.inheritFrom=category;
  this.inheritFrom("root");

  // choose_category
  this.choose_category=function() {
    new category_chooser(this.choose_category_callback.bind(this));
  }

  // choose_category_callback
  this.choose_category_callback=function(id) {
    this.sub_categories.push(id);
    this.write_div();
  }
  
  // write_div
  this.inherit_write_div=this.write_div;
  this.write_div=function(div) {
    this.inherit_write_div(div);

    if(!div)
      return;

    dom_clean(div.more);
    var more_cat=dom_create_append(div.more, "a");
    dom_create_append_text(more_cat, "More categories");
    more_cat.onclick=this.choose_category.bind(this);
  }

  // shall_request_data
  this.shall_reload=function(dummy, viewbox) {
    var list={};
    var viewbox=get_viewbox();

    for(var i=0; i<this.sub_categories.length; i++) {
      this.sub_categories[i].shall_reload(list, viewbox);
    }

    if(!keys(list).length)
      return;

    var param={};
    param.viewbox=get_viewbox();
    param.zoom=get_zoom();
    param.category=keys(list).join(",");
    param.count=10;

//    if(list_reload_working) {
//      list_reload_necessary=1;
//      return;
//    }

    //list_reload_working=1;
    ajax_direct("list.php", param, this.request_data_callback.bind(this));
  }

  // request_data_callback - called after loading new data from server
  // TODO: OSM-specific, this might not be the correct place
  this.request_data_callback=function(response) {
    var data=response.responseXML;
    //list_reload_working=0;

    if(!data) {
      alert("no data\n"+response.responseText);
      return;
    }

    var request;
    if(request=data.getElementsByTagName("request"))
      request=request[0];
    var viewbox=request.getAttribute("viewbox");

    var cats=data.getElementsByTagName("category");
    for(var cati=0; cati<cats.length; cati++) {
      var ob=get_category("osm:"+cats[cati].getAttribute("id"));
      if(ob)
	ob.recv(cats[cati], viewbox);
    }
  }

  // constructor
  register_hook("view_changed_delay", this.shall_reload.bind(this));
}

function category_list_init() {
  category_root=new _category_list();
  var x=document.getElementById("details_content");

  category_root.tags.set("name", t("list_info"));
  dom_clean(x);
  var div=dom_create_append(x, "div");

  category_root.attach_div(div);
  category_root.open_category(div);
}

register_hook("init", category_list_init);
