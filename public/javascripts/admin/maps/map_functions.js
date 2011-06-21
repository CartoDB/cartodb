		
		
		// Tools functions
		function selectStatus(status) {
			map_status = status;
			$('div#map_tools li').each(function(i,ele){
				$(ele).removeClass('selected');
			});
			
			$('div#map_tools').find('li').filter(function(){return $(this).text() == status}).addClass('selected');
			
			if (status=="select_area") {
				enableSelectionTool()
			} else {
				disableSelectionTool()
			}
		}
		
		
		
		
		var global_zIndex = 100;
		
		// Selection functions
		var	map_canvas;
		var selection_polygon;
		
		
		function disableSelectionTool() {
			map.setOptions({draggable:true});
			$('div#map').unbind('mousedown');
			if (selection_polygon!=null) selection_polygon.setMap(null);
		}
		
		
		function enableSelectionTool() {
			map_canvas = new mapCanvasStub(map);
			if (selection_polygon==null) selection_polygon = new google.maps.Polygon({strokeWeight:1});
			map.setOptions({draggable:false});
			
			// Selection tool
			$('div#map').mousedown(function(ev){
			  if (map_status=="select_area") {
          google.maps.event.clearListeners(selection_polygon, 'mouseover');
          google.maps.event.clearListeners(selection_polygon, 'mouseout');
          // if (over_polygon_tooltip!=null) {
          //  over_polygon_tooltip.hide();
          // }
          
			    var position = {};
			    position.x = ev.pageX-($('div#map').offset().left);
			    position.y = ev.pageY-($('div#map').offset().top);
					var latlng = map_canvas.transformCoordinates(new google.maps.Point(position.x,position.y));
			    
			    selection_polygon.setOptions({fillOpacity: 0});
          drawing = true;
          selection_polygon.setPath([latlng,latlng,latlng,latlng]);
			    selection_polygon.setMap(map);
			    
			    $('div#map').mousemove(function(ev){
            position.x = ev.pageX-($('div#map').offset().left);
				    position.y = ev.pageY-($('div#map').offset().top);
						var latlng = map_canvas.transformCoordinates(new google.maps.Point(position.x,position.y));
            
            selection_polygon.setPath([
              selection_polygon.getPath().getAt(0),
              new google.maps.LatLng(selection_polygon.getPath().getAt(0).lat(),latlng.lng()),
              latlng,
              new google.maps.LatLng(latlng.lat(),selection_polygon.getPath().getAt(0).lng()),
              selection_polygon.getPath().getAt(0)]);
			    });
			    
			    $('div#map').mouseup(function(ev){
			      var position = {};
			      position.x = ev.pageX-($('div#map').offset().left);
				    position.y = ev.pageY-($('div#map').offset().top);
						var latlng = map_canvas.transformCoordinates(new google.maps.Point(position.x,position.y));
			      
			      $('div#map').unbind('mouseup');
			      $('div#map').unbind('mousemove');
            drawing = false;
            selection_polygon.setOptions({fillOpacity: 0.40});
            google.maps.event.clearListeners(map, 'mousemove');
            google.maps.event.clearListeners(selection_polygon, 'click');

						console.log(markersInPolygon());

            // if (over_polygon_tooltip!=null) {
            //   over_polygon_tooltip.changeData(markersInPolygon(),latLng);
            // } else {
            //   over_polygon_tooltip = new PolygonOverTooltip(latLng, markersInPolygon(), map);
            // }

            // google.maps.event.addListener(selection_polygon,'mouseover',function(){
            //  if (over_polygon_tooltip!=null) {
            //    over_polygon_tooltip.show();
            //  }
            //  over_polygon = true;
            // });
            // 
            // google.maps.event.addListener(selection_polygon,'mouseout',function(){
            //  if (over_polygon_tooltip!=null && !say_polygon_tooltip) {
            //    over_polygon_tooltip.hide();
            //  }
            //  over_polygon = false;
            // });
			    });
			  }
			});
		}

		// Return markers what contains the selection polygon.
		function markersInPolygon() {	
			
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
		  _.each(vector_markers, function(element){
       if (Contains(selection_polygon,element.getPosition())) {
         markers_polygon.push(element.data);
       }
      });
      return markers_polygon;
		}
		
		
		
		
		
		
		
		//Marker functions
	
		function startMap(){
			cleanMap();
		}
		

		function cleanMap() {
			_.each(vector_markers,function(occ,i){
				removeMarker(occ);
			});
			vector_markers = {};
			getMarkers();
		}


		function removeMarker(occ) {
			occ.setMap(null);
		}


    function getMarkers() {
      var api_key = "";
      var query = "select *," +
                  "ST_X(ST_Transform(the_geom, 4326)) as lon_, ST_Y(ST_Transform(the_geom, 4326)) as lat_ " +
                  "from " + table_name;
      $.ajax({
        method: 'GET',
        url: "/v1/",
        data: ({api_key: api_key, sql: query}),
        headers: {'cartodbclient':true},
        dataType: 'jsonp',
        success: function(result) {
					bounds = new google.maps.LatLngBounds();
          drawMarkers(result.rows);
        },
        error: function(req, textStatus, e) {
          hideLoader();
        }
      });
    }
    
    
    function drawMarkers(table_markers) {
      _.each(table_markers,function(occ,i){
        var latlng = new google.maps.LatLng(occ.lat_,occ.lon_);
				bounds.extend(latlng);
				vector_markers[occ.cartodb_id] = drawMarker(latlng,occ);
      });
			
			map.fitBounds(bounds);
    }


		function drawMarker(latlng,occ) {
			var marker = new google.maps.Marker({
        position: latlng,
        icon: generateDotter('#FF6600'),
        flat: true,
        clickable: true,
				draggable: true,
				raiseOnDrag: false,
				animation: false,
        map: map,
				data: occ
      });

			google.maps.event.addListener(marker,'dragstart',function(ev){
				vector_markers[this.data.cartodb_id].init_latlng = ev.latLng;
			});

			google.maps.event.addListener(marker,'dragend',function(ev){
				var cartodb_id = this.data.cartodb_id;
				vector_markers[cartodb_id].lat_ = ev.latLng.lat();
				vector_markers[cartodb_id].lon_ = ev.latLng.lng();
				onMoveOccurrence(ev.latLng,cartodb_id);
			});
			
			google.maps.event.addListener(marker,'click',function(ev){
			  if (map_status=="select") {
			    infowindow.open(marker.data.cartodb_id);
			  }
			});
			
			return marker;
		}

    
    function generateDotter(color) {
      var radius = 8;

      var el = document.createElement('canvas');
      el.width = (radius * 2) + 2;
      el.height = (radius * 2) + 2;

      var ctx = el.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(radius+1, radius+1, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();

			ctx.lineWidth = 1;
      ctx.strokeStyle = "#000000";
      ctx.stroke();
      ctx.fill();

			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(radius+1, radius+1, radius-2, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();

      return el.toDataURL();
    }

		
		function onMoveOccurrence(latlng, cartodb_id) {
	    var requestId = createUniqueId();
	    requests_queue.newRequest(requestId,'change_latlng');
	
			var params = {};
			params.the_geom = '{"type":"Point","coordinates":['+latlng.lng()+','+latlng.lat()+']}';
	
	    $.ajax({
        dataType: 'text',
        type: 'PUT',
				url: '/v1/tables/'+table_name+'/records/'+cartodb_id,
        data: params,
        headers: {'cartodbclient':true},
        success: function(data) {
          requests_queue.responseRequest(requestId,'ok','');
        },
        error: function(e, textStatus) {
          try {
            requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors[0]);
          } catch (e) {
            requests_queue.responseRequest(requestId,'error','Seems like you don\'t have Internet connection');
          }
          vector_markers[cartodb_id].setPosition(vector_markers[cartodb_id].init_latlng);
        }
      });
	  }
	
	
	 	function showLoader() {
	    $('p.loading').fadeIn();
	  }


	  function hideLoader() {
	    $('p.loading').fadeOut();
	  }
	
	
		function addNewOcc(latlng) {
			var marker = drawMarker(latlng,{lat_:latlng.lat(),lon_:latlng.lng()});
			
			var requestId = createUniqueId();
	    requests_queue.newRequest(requestId,'add_occ');
			
			var params = {};
			params.the_geom = '{"type":"Point","coordinates":['+latlng.lng()+','+latlng.lat()+']}';
			
			$.ajax({
        type: "POST",
        url: '/v1/tables/'+table_name+'/records',
        headers: {"cartodbclient": true},
				data: params,
        success: function(data) {
					vector_markers[data.id] = marker;
					requests_queue.responseRequest(requestId,'ok','');
				},
				error: function(e, textStatus) {
					try {
            requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors[0]);
          } catch (e) {
            requests_queue.responseRequest(requestId,'error','Seems like you don\'t have Internet connection');
          }

          vector_markers[cartodb_id].setPosition(vector_markers[cartodb_id].init_latlng);
				}
			});
		}
		
		
		