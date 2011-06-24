

    function CartoMap (latlng,zoom) {
      this.center_ = latlng;                          // Center of the map at the beginning
      this.zoom_ = zoom;                              // Zoom at the beginning
      this.bounds_ = new google.maps.LatLngBounds();  // A latlngbounds for the map
      
      this.points_ = {};                              // Points belong to the map
      this.marker_zIndex_ = 1000;                      // Necessary for the markers hover
      this.color_ = null;                             // Cache marker color
                        
      this.status_ = "select";                        // Status of the map (select, add, )
      this.columns_ = null;
                                                    
      this.show();                                    // First step is show the map canvas
      this.showLoader();                              // Show loader
      this.createMap();                               // Create the map
    }
    
    
    
    
    CartoMap.prototype.createMap = function () {
      // Generate a google map
      var myOptions = {
        zoom: this.zoom_,
        center: this.center_,
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
      this.map_ = new google.maps.Map(document.getElementById("map"),myOptions);
      
      
      this.addMapOverlays();
      
      this.addMapListeners();
      this.addToolListeners();
    }
    
    
    CartoMap.prototype.addMapOverlays = function () {
      var me = this;
      
      head.js('/javascripts/admin/maps/Overlays/mapCanvasStub.js',
              '/javascripts/admin/maps/Overlays/CartoTooltip.js',
              '/javascripts/admin/maps/Overlays/CartoInfowindow.js',
              '/javascripts/admin/maps/Overlays/CartoDeletewindow.js',
        function(){
          me.selection_area_  = new google.maps.Polygon({strokeWeight:1});                          // Selection polygon area
    			me.info_window_      = new CartoInfowindow(new google.maps.LatLng(-260,-260),me.map_);    	// InfoWindow for markers
    			me.tooltip_         = new CartoTooltip(new google.maps.LatLng(-180,-180),1,me.map_);		// Over tooltip for markers and selection area
          me.delete_window_    = new CartoDeleteWindow(new google.maps.LatLng(-260,-260), me.map_); 	// Delete window to confirm remove one/several markers
					me.map_canvas_ 			= new mapCanvasStub(me.map_);
         
 					me.getPoints();
        }
      );
    }
    
    
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
      $('div.general_options ul li a.sql').click(function(ev){
        var map_status = ($('section.subheader ul.tab_menu li.selected a').text() == "Map");
        if (map_status) {
          stopPropagation(ev);
          $('div.general_options div.sql_console').show();
          $('div.general_options ul').addClass('sql');
          $('div.general_options span p.errors').text('Remember, if you don\'t select "the_geom", we won\'t be able to show you geolocated points').show();
          editor.focus();
        } 
      });
      // 
      // 
      // $('div.general_options a.try_query').livequery('click',function(ev){
      //   var map_status = ($('section.subheader ul.tab_menu li.selected a').text() == "Map");
      //   if (map_status) {
      //     stopPropagation(ev);
      //     getSQL();
      //   }
      // });
    }
    

    CartoMap.prototype.setMapStatus = function(status) {
      this.status_ = status;
			$('div.general_options li.map').removeClass('selected')
			$('div.general_options').find('li.map').filter(function(){return $(this).text() == status}).addClass('selected');
			
      if (status=="select_area") {
      	this.enableSelectionTool()
      } else {
      	this.disableSelectionTool()
      }
    }



		/*******************************************/
    /*  Polygon selection in the map				   */
    /*******************************************/
		CartoMap.prototype.disableSelectionTool = function() {
			this.map_.setOptions({draggable:true});
	    $('div#map').unbind('mousedown');
	    if (this.selection_area_!=null) this.selection_area_.setMap(null);
		}
		
		CartoMap.prototype.enableSelectionTool = function() {
			var me = this;
	  	this.map_.setOptions({draggable:false});
	     
	    // Selection tool
	    $('div#map').mousedown(function(ev){
	     	if (me.status_=="select_area") {
	     		google.maps.event.clearListeners(me.selection_area_, 'mouseover');
	        google.maps.event.clearListeners(me.selection_area_, 'mouseout');
          // if (over_polygon_tooltip!=null) {
          //  over_polygon_tooltip.hide();
          // }
	              
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
    
           		console.log(me.markersInPolygon(me.selection_area_));
	    
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
	        markers_polygon.push(element.data);
	      }
	     });
	     return markers_polygon;
		}
    
   
    
    
    
    
    
    
    
    
    
    
    
    
    
    CartoMap.prototype.getPoints = function() {
      var me = this;
      
      var api_key = "";
      var query = "select *," +
                  "ST_X(ST_Transform(the_geom, 4326)) as lon_, ST_Y(ST_Transform(the_geom, 4326)) as lat_" +
                  " from " + table_name;
      $.ajax({
        method: 'GET',
        url: "/v1/",
        data: ({api_key: api_key, sql: query}),
        headers: {'cartodbclient':true},
        dataType: 'jsonp',
        success: function(result) {
          me.drawMarkers(result.rows);
        },
        error: function(req, textStatus, e) {
          me.hideLoader();
        }
      });
    }
    
    
    
    CartoMap.prototype.drawMarkers = function(points) {
      var me = this;
      this.bounds_ = new google.maps.LatLngBounds();
      asyncDrawing(points);
      
      function asyncDrawing(rest) {
        if (_.size(rest)>0) {
          var info = _.first(rest);
          var occ_id = info.cartodb_id;
          var latlng = new google.maps.LatLng(info.lat_,info.lon_);
          me.points_[occ_id] = me.addMarker(latlng, _.first(rest), false);
          me.bounds_.extend(latlng);
          setTimeout(asyncDrawing(_.rest(rest)),0);
        } else {
          me.map_.fitBounds(me.bounds_);
          me.map_.setCenter(me.bounds_.getCenter());
          me.hideLoader();
        }
      }
    }
    
    
    /*******************************************/
    /*  Add a simple marker to the map         */
    /*******************************************/
    CartoMap.prototype.addMarker = function(latlng,info,save) {
      var me = this;
      
      var marker = new google.maps.Marker({
        position: latlng,
        icon: this.generateDot('#FF6600'),
        flat: true,
        clickable: true,
        draggable: true,
        raiseOnDrag: false,
        animation: false,
        map: this.map_,
        data: info
      });


      google.maps.event.addListener(marker,'dragstart',function(ev){
        this.data.init_latlng = ev.latLng;
				
				// Hide all floating map windows
				me.delete_window_.hide();
				me.info_window_.hide();
				me.tooltip_.hide();
      });


      google.maps.event.addListener(marker,'dragend',function(ev){
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
       
       
      if (save) {
        var params = {};
        params.the_geom = '{"type":"Point","coordinates":['+latlng.lng()+','+latlng.lat()+']}';
        this.updateTable('/records',params,marker,null,"add_point","POST");
      } 
       
      return marker;
    }
    

    
    
    
    /*******************************************/
    /*  Generate canvas image to fill marker   */
    /*******************************************/
    CartoMap.prototype.generateDot = function(color) {
      if (this.color_==null) {
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
        
        this.color_ = el.toDataURL();
      }
      return this.color_;
    }
    
    
    
    
    
    /*******************************************/
    /*  Remove one or serveral markers         */
    /*******************************************/
    CartoMap.prototype.removeMarkers = function(array) {
      var me = this;
			var type = 'remove_point';
			var cartodb_ids = '';
			
			if (_.size(array)>20) {
				this.showLoader();
				type = 'remove_points';
			}
			
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


		CartoMap.prototype.deleteMarker = function(marker) {
      marker.setMap(null);
    }
    
    
    /*******************************************/
    /*  Reset map                              */
    /*******************************************/
    CartoMap.prototype.refresh = function() {
      this.show();
  		
      this.status_ = "select";
  		$('div#map_tools').find('li').removeClass('selected');
  		$('div#map_tools li').first().addClass('selected');

			this.getPoints();
    }
    

    /*******************************************/
    /*  Clear map                              */
    /*******************************************/
    CartoMap.prototype.clearMap = function() {
      // Making this function faster as possible, we don't use async + underscore-each
      _.each(this.points_,function(ele,i){
        ele.setMap(null);
      });
      this.points_ = {};
    }
    

    
    
    
    
    
    /*******************************************/
    /*  Toggle loader visibility               */
    /*******************************************/
    CartoMap.prototype.hideLoader = function() {
      $('div.loading').fadeOut();
    }
    
    CartoMap.prototype.showLoader = function() {
      $('div.loading').fadeIn();
    }
    

    
    /*******************************************/
    /*  Toggle map visibility                  */
    /*******************************************/
    CartoMap.prototype.hide = function() {
      $('div.map_window div.map_curtain').show();
    }
    
    CartoMap.prototype.show = function() {
      $('div.map_window div.map_curtain').hide();
      this.clearMap();
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    /*******************************************/
    /*  Request operations on the map          */
    /*******************************************/
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
        url: '/v1/tables/'+table_name+url_change,
        data: params,
        success: function(data) {
          requests_queue.responseRequest(requestId,'ok','');
          me.successRequest(params,new_value,old_value,type,data);
        },
        error: function(e, textStatus) {
          try {
            requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors[0]);
          } catch (e) {
            requests_queue.responseRequest(requestId,'error','There has been an error, try again later...');
          }
          me.errorRequest(params,new_value,old_value,type);
        }
      });

    }
    
    
		/*******************************************/
    /*  Request operations on the map          */
    /*******************************************/
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
    
    
    
    
    