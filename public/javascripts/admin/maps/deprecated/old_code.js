////////////////////////////////////////
//  POLYGON OPERATIONS OVER THE MAP		//
////////////////////////////////////////
/* Disable selection area  */
CartoMap.prototype.disableSelectionTool = function() {
	this.map_.setOptions({draggable:true});
  $('div#map').unbind('mousedown');
  if (this.selection_area_!=null) this.selection_area_.setMap(null);
}

/* Enable selection area  */	
CartoMap.prototype.enableSelectionTool = function() {
	var me = this;
	this.map_.setOptions({draggable:false});
   
  // Selection tool
  $('div#map').mousedown(function(ev){
   	if (me.status_=="select_area") {
   		google.maps.event.clearListeners(me.selection_area_, 'mouseover');
      google.maps.event.clearListeners(me.selection_area_, 'mouseout');
      me.tooltip_.hide();
            
      var position = {};
      position.x = ev.pageX-($('div#map').offset().left);
      position.y = ev.pageY-($('div#map').offset().top);
      var latlng = me.map_canvas_.transformCoordinates(new google.maps.Point(position.x,position.y));
      
      me.selection_area_.setOptions({fillOpacity: 0});
      me.drawing = true;
      me.selection_area_.setPath([latlng,latlng,latlng,latlng]);
      me.selection_area_.setMap(me.map_);
      
      $('div#map').mousemove(function(ev){
        position.x = ev.pageX-($('div#map').offset().left);
        position.y = ev.pageY-($('div#map').offset().top);
        var latlng = me.map_canvas_.transformCoordinates(new google.maps.Point(position.x,position.y));
             
       	me.selection_area_.setPath([
					me.selection_area_.getPath().getAt(0),
          new google.maps.LatLng(me.selection_area_.getPath().getAt(0).lat(),latlng.lng()),
          latlng,
          new google.maps.LatLng(latlng.lat(),me.selection_area_.getPath().getAt(0).lng()),
          me.selection_area_.getPath().getAt(0)]);
 				});
      
       	$('div#map').mouseup(function(ev){
        	var position = {};
         	position.x = ev.pageX-($('div#map').offset().left);
         	position.y = ev.pageY-($('div#map').offset().top);
         	var latlng = me.map_canvas_.transformCoordinates(new google.maps.Point(position.x,position.y));
         
         	$('div#map').unbind('mouseup');
         	$('div#map').unbind('mousemove');

        	drawing = false;
          me.selection_area_.setOptions({fillOpacity: 0.40});
          google.maps.event.clearListeners(me.map_, 'mousemove');
          google.maps.event.clearListeners(me.selection_area_, 'click');

					var markers = me.markersInPolygon(me.selection_area_);
  
          google.maps.event.addListener(me.selection_area_,'mouseover',function(){
            me.tooltip_.openPolgyon(latlng,markers);
           	me.over_marker_ = true;
						me.tooltip_.show();
          });
        
          google.maps.event.addListener(me.selection_area_,'mouseout',function(){
           	me.over_marker_ = false;
          });

					me.tooltip_.show();
       	});
     	}
   });
}

/* Calculate markers in selection area  */			
CartoMap.prototype.markersInPolygon = function(selection_polygon) {
 	//Check if the polygon contains this point
  function Contains(polygon, point) { 
     var j=0; 
     var oddNodes = false; 
     var x = point.lng(); 
     var y = point.lat(); 
     for (var i=0; i < polygon.getPath().getLength(); i++) { 
       j++; 
       if (j == polygon.getPath().getLength()) {j = 0;} 
       if (((polygon.getPath().getAt(i).lat() < y) && (polygon.getPath().getAt(j).lat() >= y)) || ((polygon.getPath().getAt(j).lat() < y) && (polygon.getPath().getAt(i).lat() >= y))) { 
         if ( polygon.getPath().getAt(i).lng() + (y - polygon.getPath().getAt(i).lat()) /  (polygon.getPath().getAt(j).lat()-polygon.getPath().getAt(i).lat()) *  (polygon.getPath().getAt(j).lng() - polygon.getPath().getAt(i).lng())<x ) { 
           oddNodes = !oddNodes; 
         } 
       } 
     } 
     return oddNodes; 
   };
   
  var markers_polygon = [];
	_.each(this.points_, function(element){
    if (Contains(selection_polygon,element.getPosition())) {
      markers_polygon.push(element);
    }
   });
   return markers_polygon;
}



////////////////////////////////////////
//  REQUEST POINTS TO DRAW IN THE MAP	//
////////////////////////////////////////
CartoMap.prototype.getPoints = function() {
  var me = this;
  
  var api_key = "",
			query_url = "";

	if (this.query_mode) {
	  var value = editor.getValue();
	  var sql_ = value.split(/(from|FROM|From)/,3);
	  sql_[1] = ", ST_AsGeoJSON(the_geom) as coordinates_ FROM ";
	  value = sql_.join('');
	  
		query_url = global_api_url+'queries?sql='+ escape(value);
		var now = new Date();
	} else {
		query_url = global_api_url+'queries?sql='+ escape("select *,ST_AsGeoJSON(the_geom) as coordinates_ from " + table_name);
	}
	
	

  $.ajax({
    method: 'GET',
    url: query_url,
    headers: {'cartodbclient':true},
    success: function(result) {
			if (me.query_mode) {
				var arrived = new Date();
				var total = result.total_rows;
        $('div.sql_window p.errors').fadeOut();
				$('span.query h3').html(total + ' row' + ((total>1)?'s':'') + ' matching your query <a class="clear_table" href="#clear">CLEAR VIEW</a>');
				$('span.query p').text('This query took '+(arrived - now)/1000+' seconds');
			}
			me.drawMarkers(result.rows);
    },
    error: function(e) {
			if (me.query_mode) {
				var json = $.parseJSON(e.responseText);
        var msg = '';

        _.each(json.errors,function(text,pos){
          msg += text + ', ';
        });
        msg = msg.substr(0,msg.length-2);
				
				$('span.query h3').html('No results for this query <a class="clear_table" href="#clear">CLEAR VIEW</a>');
				$('span.query p').text('');
				$('div.sql_window p.errors').text(msg).fadeIn();
			}
      me.hideLoader();
    }
  });
}