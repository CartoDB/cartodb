	
		////////////////////////////////////////////////////////////////////////////////
    //																																						//
		//  	 CLASS TO MANAGE ALL THE STUFF IN THE MAP (variable -> carto_map)			  //
		//     Actually, this is map of the application, and everything that					//
		//		 occurs on/over/with/in the map will be manage here.										//
		//		 																																				//
		//		 Overlays:  																														//
		//			 .selection_area_ 																										//
		//			 .info_window_    																										//					
    //			 .tooltip_                                                         		//
		//       .delete_windsow_                                                  		//
    //       .map_canvas_                                                      		//
		//																																						//
		////////////////////////////////////////////////////////////////////////////////



    function CartoMap (latlng,zoom) {
      this.center_ = latlng;                          // Center of the map at the beginning
      this.zoom_ = zoom;                              // Zoom at the beginning
      this.bounds_ = new google.maps.LatLngBounds();  // A latlngbounds for the map
      this.query_mode = false;												// Query mode

      this.points_ = {};                              // Points belong to the map
      this.marker_zIndex_ = 1000;                     // Necessary for the markers hover
                        
      this.status_ = "select";                        // Status of the map (select, add, )
      this.columns_ = null;
                                                    
      this.show();                                    // First step is show the map canvas
      this.showLoader();                              // Show loader
      this.createMap();                               // Create the map
    }
    
    
    
    ////////////////////////////////////////
    //  INIT MAP												  //
    ////////////////////////////////////////
    CartoMap.prototype.createMap = function () {
      
      // Generate a google map
      var myOptions = {
        zoom: this.zoom_,
        center: this.center_,
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
      
      this.map_ = new google.maps.Map(document.getElementById("map"),myOptions);
      
			// Change view mode and watch if query mode is activated
			this.query_mode = ($('body').attr('query_mode') === 'true');
			$('body').attr('view_mode','map');
      
      this.addMapOverlays();
      this.addMapListeners();
      this.addToolListeners();
      
      
      
      
      
      /*TEST ZONE*/

      // interaction placeholder
      var currentCartoDbId,
          me = this;
      
      this.tilejson = {
        tilejson: '1.0.0',
        scheme: 'xyz',
        tiles: ['http://admin.localhost.lan:8181/tiles/'+table_name+'/{z}/{x}/{y}.png8'],
        grids: ['http://admin.localhost.lan:8181/tiles/'+table_name+'/{z}/{x}/{y}.grid.json'],
        formatter: function(options, data) { 
          currentCartoDbId = data.cartodb_id;
          return data.cartodb_id; 
        }
      };
      var that = this;
      this.waxOptions = {
        callbacks: {
          out: function(){
            me.over_marker_ = false;
            that.map_.setOptions({ draggableCursor: 'default' });
            //document.body.style.cursor='progress';
            //maybe can destroy tooltips here?
          }, 
          // you can see lat/long & pixel x/y in the evt object.
          // feature has the cartodb_id that we use for the ajax tooltip
          over: function(feature, div, opt3, evt){
            me.over_marker_ = true;
            that.map_.setOptions({ draggableCursor: 'pointer' });
            //document.body.style.cursor='pointer';
            //console.log(feature,div,opt3,evt);
            //me.tooltip_.open(evt.latLng,[this]);
          },
          // you can see lat/long & pixel x/y in the evt object. 
          //feature has the cartodb_id that we use for the ajax tooltip
          click: function(feature, div, opt3, evt){
            console.log('click!');
            me.info_window_.openWax(feature);
          }
        },
        clickAction: 'full'  //or 'location' or 'teaser'
      };
      
      
      //this.map_.mapTypes.set('mb',new wax.g.connector(tilejson));
      //this.map_.setMapTypeId('mb');
      this.wax_tile = new wax.g.connector(this.tilejson);
      this.map_.overlayMapTypes.insertAt(0,this.wax_tile);
      this.interaction = wax.g.interaction(this.map_, this.tilejson, this.waxOptions);


      this.hideLoader();

      /*END TEST ZONE*/
    }
    
    

		////////////////////////////////////////
    //  ADD ALL NECESSARY OVERLAYS				//
    ////////////////////////////////////////
    CartoMap.prototype.addMapOverlays = function () {
      var me = this;
      
      head.js('/javascripts/admin/maps/Overlays/mapCanvasStub.js',
              '/javascripts/admin/maps/Overlays/CartoTooltip.js',
              '/javascripts/admin/maps/Overlays/CartoInfowindow.js',
              '/javascripts/admin/maps/Overlays/CartoDeletewindow.js',
        function(){
          me.selection_area_  = new google.maps.Polygon({strokeWeight:1});                          // Selection polygon area
    			me.info_window_     = new CartoInfowindow(new google.maps.LatLng(-260,-260),me.map_);     // InfoWindow for markers
    			me.tooltip_         = new CartoTooltip(new google.maps.LatLng(-260,-260),me.map_);				// Over tooltip for markers and selection area
          me.delete_window_   = new CartoDeleteWindow(new google.maps.LatLng(-260,-260), me.map_);  // Delete window to confirm remove one/several markers
					me.map_canvas_ 			= new mapCanvasStub(me.map_);
         					
					//me.getColumns();
 					//me.getPoints();
        }
      );
    }
    
    

		////////////////////////////////////////
    //  MAP AND TOOLS LISTENERS						//
    ////////////////////////////////////////
		/* Event listeners of the map */
    CartoMap.prototype.addMapListeners = function() {
      var me = this;
      
      google.maps.event.addListener(this.map_, 'zoom_changed', function() {
				$('span.slider').slider('value',me.map_.getZoom());
			});
			
			google.maps.event.addListener(this.map_, 'click', function(ev) {
        if (me.status_=="add") {
          me.addMarker(ev.latLng, {lat_:ev.latLng.lat(), lon_:ev.latLng.lng()}, true);
        }
			});
    }
      
		/* Event listeners of the map tools */
    CartoMap.prototype.addToolListeners = function() {
      var me = this;
      
      // Map tools
      $('div.general_options ul li.map a').hover(function(){
        // Change text
        var text = $(this).text().replace('_',' ');
        $('div.general_options div.tooltip p').text(text);
        // Check position
        var right = -($(this).offset().left-$(window).width());
        var offset = $('div.general_options div.tooltip').width()/2;
        // near right edge
        if (right-13-offset<0) {
          right = 16 + offset;
          $('div.general_options div.tooltip span.arrow').css({left:'83%'});
        } else {
          $('div.general_options div.tooltip span.arrow').css({left:'50%'});
        }
        $('div.general_options div.tooltip').css({right:right-13-offset+'px'});        
        // Show
        $('div.general_options div.tooltip').show();
      },function(){
        $('div.general_options div.tooltip').hide();
      });
      // Change map status
      $('div.general_options ul li.map a').click(function(ev){
        stopPropagation(ev);
        var status = $(this).attr('class');
        me.setMapStatus(status);
      });
      
      
      //Zooms
      $('a.zoom_in').click(function(ev){
        stopPropagation(ev);
        var new_zoom = me.map_.getZoom()+1;
        if (new_zoom<=20) {
          me.map_.setZoom(new_zoom);
          $('span.slider').slider('value',new_zoom);
        }
      });
      $('a.zoom_out').click(function(ev){
        stopPropagation(ev);
        var new_zoom = me.map_.getZoom()-1;
        if (new_zoom>=0) {
          me.map_.setZoom(new_zoom);
          $('span.slider').slider('value',new_zoom);
        }
      });
      
      // Zoom slider
      $('span.slider').slider({
        orientation: 'vertical',
        min:0,
        max:20,
        value:1,
        stop: function(event,ui){
          me.map_.setZoom(ui.value);
        }
      });
      
      
      // SQL Map console
			$('body').bind('query_refresh',function(ev){
				var view_map = ($('body').attr('view_mode') == 'map');
			  if (view_map && me.query_mode) {
					stopPropagation(ev);
					me.query_mode = false;
					me.showLoader();
					me.refresh();
        }
			});
			// Try query
      $('div.sql_window a.try_query').livequery('click',function(ev){
        var map_status = ($('body').attr('view_mode') == "map");
        if (map_status) {
	        $('body').attr('query_mode','true');
					me.query_mode = true;
					setAppStatus();
					me.showLoader();
          me.refresh(true);
        }
      });
    }



    ////////////////////////////////////////
    //  SET MAP && MARKER STATUS			    //
    ////////////////////////////////////////
		/* Set map status */
		CartoMap.prototype.setMapStatus = function(status) {
      this.status_ = status;
			this.setMarkerStatus(status);
			
			$('div.general_options li.map').each(function(i,ele){
				$(ele).removeClass('selected');
			});
			$('div.general_options').find('li.map').filter(function(){return $(this).text() == status}).addClass('selected');
			
      if (status=="select_area") {
      	this.enableSelectionTool()
      } else {
      	this.disableSelectionTool()
      }
			
			this.hideOverlays()
    }

		/* Set markers status */		
		CartoMap.prototype.setMarkerStatus = function(status) {
			_.each(this.points_,function(marker,i){
				marker.setDraggable((status=="select")?true:false);
				marker.setClickable((status=="select")?true:false);
			});
		}



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
    
    

    ////////////////////////////////////////
    //  DRAW MARKERS WITH CANVAS ASYNC		//
    ////////////////////////////////////////
		/* Draw markers asyncronously */
    CartoMap.prototype.drawMarkers = function(points) {
      var me = this;
      this.bounds_ = new google.maps.LatLngBounds();
      asyncDrawing(points);
      
      function asyncDrawing(rest) {
        if (_.size(rest)>0) {
					var info = _.first(rest);
					// Get the_geom
					if (info.coordinates_!=undefined) {
						var geom = $.parseJSON(info.coordinates_);
						
						if (geom.type == "Point") {
		          var occ_id = info.cartodb_id;
		          var latlng = new google.maps.LatLng(geom.coordinates[1],geom.coordinates[0]);
							var marker = me.addMarker(latlng, info, false);
		          me.points_[occ_id] = marker;
		          me.points_[occ_id] = info;
		          me.bounds_.extend(latlng);
						}
					}

          setTimeout(asyncDrawing(_.rest(rest)),1);
        } else {
					if (me.bounds_.isEmpty()) {
						me.map_.setCenter(new google.maps.LatLng(0,0));
						me.map_.setZoom(2);
					} else {
						me.map_.fitBounds(me.bounds_);
					}
					me.hideLoader();
        }
      }
    }
    
    /* Add single google marker to the map */
    CartoMap.prototype.addMarker = function(latlng,info,save) {
      var me = this;
      
      var image = new google.maps.MarkerImage((!this.query_mode)?this.generateDot('#FF6600'):this.generateDot('#666666'),
            new google.maps.Size(20, 20),
            new google.maps.Point(0,0),
            new google.maps.Point(10, 10));
      
      var marker = new google.maps.Marker({
        position: latlng,
        icon: image,
        flat: true,
        clickable: (!this.query_mode)?true:false,
        draggable: (!this.query_mode)?true:false,
        raiseOnDrag: false,
        animation: false,
        map: this.map_,
        data: info
      });

			
			if (!this.query_mode) {
				google.maps.event.addListener(marker,'mouseover',function(){
					me.over_marker_ = true;
	        if (me.status_ == "select" && !me.marker_dragging_ && !me.info_window_.isVisible(marker.data.cartodb_id) && !me.delete_window_.isVisible(marker.data.cartodb_id)) {
						var latlng = this.getPosition();
						me.tooltip_.open(latlng,[this]);
					} else {
						me.tooltip_.hide();
					}
	      });

				google.maps.event.addListener(marker,'mouseout',function(){
					me.over_marker_ = false;
					setTimeout(function(){
						if (!me.over_marker_) me.tooltip_.hide();
					},100);
	      });

	      google.maps.event.addListener(marker,'dragstart',function(ev){
					me.marker_dragging_ = true;
	        this.data.init_latlng = ev.latLng;

					// Hide all floating map windows
					me.hideOverlays();
	      });

	      google.maps.event.addListener(marker,'dragend',function(ev){
					me.marker_dragging_ = false;
	        var occ_id = this.data.cartodb_id;
	        var params = {};
	        params.the_geom = '{"type":"Point","coordinates":['+ev.latLng.lng()+','+ev.latLng.lat()+']}';
	        params.cartodb_id = occ_id;
	        me.updateTable('/records/'+occ_id,params,ev.latLng,this.data.init_latlng,"change_latlng","PUT");
	      });

	      google.maps.event.addListener(marker,'click',function(ev){
	        if (me.status_=="select") {
	          me.info_window_.open(this);
	        }
	      });

				google.maps.event.addListener(marker,'mouseover',function(ev){
	        if (me.status_=="select") {
	          this.setZIndex(me.marker_zIndex_++);
	        }
	      });
			}

       
       
      if (save) {
        var params = {};
        params.the_geom = '{"type":"Point","coordinates":['+latlng.lng()+','+latlng.lat()+']}';
        this.updateTable('/records',params,marker,null,"add_point","POST");
      } 
       
      return marker;
    }
    
    /* Generate canvas image to fill marker   */
    CartoMap.prototype.generateDot = function(color) {
      if (this[color]==null) {
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
        
        this[color] = el.toDataURL();
      }
      return this[color];
    }
    
    
    
    ////////////////////////////////////////
    //  REMOVE MARKERS FROM MAP ASYNC 		//
    ////////////////////////////////////////
    /* Remove markers from map object */
    CartoMap.prototype.removeMarkers = function(array) {
      var me = this;
			var type = 'remove_point';
			var cartodb_ids = '';
			
			if (_.size(array)>20) {
				this.showLoader();
			}
			
			if (_.size(array)>1)
				type = 'remove_points';
				
			
			asyncRemoving(array);
			
			function asyncRemoving(rest) {
				if (_.size(rest)>0) {
          var marker = _.first(rest);
          me.deleteMarker(marker);
					cartodb_ids += marker.data.cartodb_id + ','
          setTimeout(asyncRemoving(_.rest(rest)),0);
				} else {
					var params = {};
					params.cartodb_ids = cartodb_ids.substr(0,cartodb_ids.length-1);
					me.updateTable('/records/'+params.cartodb_ids,params,null,null,type,"DELETE");
					me.hideLoader();
				}
			}
    }

		/* Set each marker to null in the map */
		CartoMap.prototype.deleteMarker = function(marker) {
      marker.setMap(null);
    }
    


    ////////////////////////////////////////
    //  GET TABLE COLUMNS TO FILL INFO	  //
    ////////////////////////////////////////
    CartoMap.prototype.getColumns = function() {
			var me = this;
			
      $.ajax({
        dataType: 'json',
        type: 'GET',
        headers: {"cartodbclient": true},
        url: global_api_url+'tables/'+table_name +'/columns',
        success: function(data) {
					var new_array = [];
					_.each(data,function(ele,i){
						if (ele[0] != 'created_at' && ele[0] != 'updated_at' && ele[0] != 'the_geom' && ele[0] != 'cartodb_id') {
							new_array.push(ele[0]);
						}
					});
					
					me.info_window_.columns_ = new_array;
        },
        error: function(e, textStatus) {
          me.info_window_.columns_ = [];
        }
      });
    }


    
    ////////////////////////////////////////
    //  REFRESH / CLEAR / CLEAN OVERLAYS  //
    ////////////////////////////////////////
    /* Reset map */
    CartoMap.prototype.refresh = function(sql) {
			this.query_mode = ($('body').attr('query_mode') === 'true');
			$('body').attr('view_mode','map');
		
      this.show();
			//this.showLoader();

      // Add again wax layer
      this.wax_tile = new wax.g.connector(this.tilejson);
      this.map_.overlayMapTypes.insertAt(0,this.wax_tile);
      wax.g.interaction(this.map_, this.tilejson, this.waxOptions);

      // if (sql) {
      //  this.clearMap(true);
      // } else {
      //  this.setMapStatus('select');
      //  this.getColumns();
      //  this.getPoints();
      // }
    }

    /* Clear map */
    CartoMap.prototype.clearMap = function(sql) {
      
      // Remove wax layer and fake markers | polygon | polyline
      if (this.map_ != undefined) {
        this.map_.overlayMapTypes.clear();
      }
      
      // Making this function faster as possible, we don't use async + underscore-each
      // _.each(this.points_,function(ele,i){
      //   ele.setMap(null);
      // });
      // this.points_ = {};
			//if (sql) this.getPoints();
    }
    
		/* Hide all overlays (no markers) */ 
		CartoMap.prototype.hideOverlays = function() {
			this.delete_window_.hide();
			this.info_window_.hide();
			this.tooltip_.hide();
		}
    


    ////////////////////////////////////////
    //  HIDE OR SHOW THE MAP LOADER				//
    ////////////////////////////////////////
    CartoMap.prototype.hideLoader = function() {
      $('div.loading').fadeOut();
    }
    
    CartoMap.prototype.showLoader = function() {
      $('div.loading').fadeIn();
    }
    

    
    ////////////////////////////////////////
    //  HIDE OR SHOW MAP							    //
    ////////////////////////////////////////
    CartoMap.prototype.hide = function() {
      $('div.map_window div.map_curtain').show();
    }
    
    CartoMap.prototype.show = function() {
      $('div.map_window div.map_curtain').hide();
      this.clearMap();
    }
    
    

    ////////////////////////////////////////
    //  REQUEST OPERATIONS OVER THE MAP   //
    ////////////////////////////////////////
		/* Send request */
    CartoMap.prototype.updateTable = function(url_change,params,new_value,old_value,type,request_type) {
      var me = this;
      
      //Queue loader
      var requestId = createUniqueId();
      params.requestId = requestId;
      requests_queue.newRequest(requestId,type);

      $.ajax({
        dataType: 'json',
        type: request_type,
        dataType: "text",
        headers: {"cartodbclient": true},
        url: global_api_url+'tables/'+table_name+url_change,
        data: params,
        success: function(data) {
          requests_queue.responseRequest(requestId,'ok','');
          me.successRequest(params,new_value,old_value,type,data);
        },
        error: function(e, textStatus) {
          try {
						var msg = $.parseJSON(e.responseText).errors[0].error_message;
						if (msg == "Invalid rows: the_geom") {
	            requests_queue.responseRequest(requestId,'error','First georeference your table');
						} else {
	            requests_queue.responseRequest(requestId,'error',msg);
						}
          } catch (e) {
            requests_queue.responseRequest(requestId,'error','There has been an error, try again later...');
          }
          me.errorRequest(params,new_value,old_value,type);
        }
      });

    }
    
		/* If request is succesful */
    CartoMap.prototype.successRequest = function(params,new_value,old_value,type,more) {
      switch (type) {
        case "add_point":       var occ_id = $.parseJSON(more).id;
                                new_value.data.cartodb_id = occ_id;
                                this.points_[occ_id] = new_value;
                                break;
        case "remove_point":    var array = (params.cartodb_ids).split(',');
																var me = this;
																_.each(array,function(ele,i){
																	delete me.points_[ele];
																});
                                break;

        default:                break;
      }
    }
    
		/* If request fails */   
    CartoMap.prototype.errorRequest = function(params,new_value,old_value,type) {      
      switch (type) {
        case "add_point":       new_value.setMap(null);
                                break;
        case "change_latlng":   var occ_id = params.cartodb_id;
                                (this.points_[occ_id]).setPosition(old_value);
                                break;
        case "remove_point":    var array = (params.cartodb_ids).split(',');
																var me = this;
																_.each(array,function(ele,i){
																	me.points_[ele].setMap(me.map_);
																});
                                break;

        default:                break;
      }
    }
    