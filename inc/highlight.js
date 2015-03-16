var highlight_current_active={};
var highlight_feature=[];
var highlight_feature_timer;
var highlight_next_no_zoom=false; // when set to true, next 'pan_to_highlight' does not zoom, only center

function calc_size_on_map(features) {
  if(features.length == 0)
    return { w: 0, h: 0 };

  var extent = features[0].getGeometry().getExtent();
  for(var i=1; i<features.length; i++) {
    extent = ol.extent.extend(extent, features[i].getGeometry().getExtent());
  }

  var leftupper=map.getPixelFromCoordinate(ol.extent.getTopLeft(extent));
  var rightbottom=map.getPixelFromCoordinate(ol.extent.getBottomRight(extent));

  return {
    w: rightbottom[0] - leftupper[0],
    h: rightbottom[1] - leftupper[1]
  };
}

function pan_to_highlight(lon, lat, zoom) {
  var autozoom=options_get("autozoom");

  if(highlight_next_no_zoom)
    zoom=map.zoom;

  if((zoom)&&((map.zoom>zoom+1)||(map.zoom<zoom-1))) {
    if((!autozoom)||(autozoom=="pan")||(autozoom=="move"))
      map.setCenter(new OpenLayers.LonLat(lon, lat), zoom);
  }
  else {
    if((!autozoom)||(autozoom=="pan"))
      map.panTo(new OpenLayers.LonLat(lon, lat));
    else if(autozoom=="move")
      map.setCenter(new OpenLayers.LonLat(lon, lat), map.zoom);
  }

  highlight_next_no_zoom=false;
}

var last_highlight_request;

function set_highlight_after_loading(response) {
  var data=response.responseXML;

  if(!data) {
    alert("no data\n"+response.responseText);
    return;
  }

  var osm=data.getElementsByTagName("osm");
  load_objects_from_xml(osm);

  var req=data.getElementsByTagName("request");
  req=req[0];
  var r=req.firstChild;
  while(r) {
    loaded_list[r.getAttribute("id")]=1;
    r=r.nextSibling;
  }

  real_set_highlight();
}

function real_set_highlight() {
  var new_highlight_feature=[];

  for(var i=0; i<last_highlight_request.length; i++) {
    var el=get_loaded_object(last_highlight_request[i]);
    if(el) {
      var hl=el.get_highlight();
      new_highlight_feature=new_highlight_feature.concat(hl);

      var ob=document.getElementById("list_"+last_highlight_request[i]);
      if(ob)
	ob.className="listitem_highlight";
    }
    else {
      if(loaded_list[last_highlight_request[i]]) {
	var ob=document.getElementById("list_"+last_highlight_request[i]);
	if(ob)
	  ob.className="listitem_notfound";
      }
    }
  }

  for(var i in new_highlight_feature) {
    vector_layer.getSource().addFeature(new_highlight_feature[i]);
    highlight_feature.push(new_highlight_feature[i]);
  }
}

function set_highlight(list, dont_load) {
  //highlight_feature=[];
  if(highlight_feature_timer)
    clearTimeout(highlight_feature_timer);

  var load_list=[];
  last_highlight_request=list;

  for(var i=0; i<list.length; i++) {
    var el=get_loaded_object(list[i]);
    if(!el) {
      load_list.push(list[i]);

      var ob=document.getElementById("list_"+list[i]);
      if(ob)
	ob.className="listitem_loading";
    }
  }

  if(load_list.length&&(!dont_load)) {
    ajax("load_object", { "obj": load_list }, set_highlight_after_loading);
  }

  real_set_highlight();


//  lon=lon/list.length;
//  lat=lat/list.length;
//  highlight_feature_timer=setTimeout("pan_to_highlight("+lon+", "+lat+")", 500);
}

function unset_highlight() {
  if(highlight_feature_timer)
    clearTimeout(highlight_feature_timer);

  var obs=document.getElementsByTagName("li");
  for(var i=0; i<obs.length; i++) {
    if(obs[i].id&&obs[i].id.match(/^list_/)) {
      obs[i].className="listitem";
    }
  }

  for(var i = 0; i < highlight_feature.length; i++)
    vector_layer.getSource().removeFeature(highlight_feature[i]);
  highlight_feature=[];
  last_highlight_request=[];

  for(var i in highlight_current_active) {
    highlight_current_active[i].hide();
  }
}

/**
 * class highlight
 * geos: string or array of strings ... WKTs defining geometric objects
 * center: the center of the objects which will be circled
 */
function highlight(geos, center) {
  this.features=[];
  this.center_feature=[];
  this.shown=false;

  // show
  this.show=function() {
    var too_big=false;

    if(this.features) {
      for(var i=0; i<this.features.length; i++)
        vector_layer.getSource().addFeature(this.features[i]);

      var size=calc_size_on_map(this.features);
      if((size.w>30) || (size.h>30))
	too_big=true;
    }

    if(this.center_feature) {
      if(too_big)
        for(var i=0; i<this.center_feature.length; i++)
          vector_layer.getSource().removeFeature(this.center_feature[i]);
      else
        for(var i=0; i<this.center_feature.length; i++)
          vector_layer.getSource().addFeature(this.center_feature[i]);
    }

    this.shown=true;

    highlight_current_active.id=this;
  }

  // hide
  this.hide=function() {
    for(var i=0; i<this.features.length; i++)
      vector_layer.getSource().removeFeature(this.features[i]);
    if(this.center_feature)
        for(var i=0; i<this.center_feature.length; i++)
          vector_layer.getSource().removeFeature(this.center_feature[i]);
    this.shown=false;

    delete(highlight_current_active.id);
  }

  // add_geo
  this.add_geo=function(geos) {
    if(typeof(geos) == 'string')
      geos=[ geos];

    for(var i=0; i<geos.length; i++) {
      var geo=geos[i];

      var new_features=wkt_to_features(geo);
      this.features=this.features.concat(new_features);

      set_feature_style(this.features, 
        new ol.style.Style({
          "stroke": new ol.style.Stroke({
            "color": "black",
            "width": 4,
          }),
          "image": new ol.style.Icon({
            "src": "img/big_node.png"
          })
        }));
    }

    if(this.shown)
      this.show();
  }

  // constructor
  this.add_geo(geos);

  if(center) {
    this.center_feature=wkt_to_features(center);

    set_feature_style(this.center_feature, 
      new ol.style.Style({
        "image": new ol.style.Icon({
          "src": "img/hi_node.png"
        })
      }));
  }
}
