
    ////////////////////////////////////////////////////////////////////////////////
    //																			                                      //      
    //  	 CLASS TO MANAGE ALL THE STUFF IN THE MAP (variable -> carto_map)	      //                                                                        
    //          Actually, this is map of the application, and everything that	    //                                                                      
    //		    occurs on/over/with/in the map will be manage here.				          //                                                          
    //		 																	                                      //      
    //		 Overlays:  														                                //                  
    //			 .selection_area_ 												                            //                          
    //			 .info_window_    												                            //                          
    //			 .tooltip_                                                            //                                                                      
    //       .delete_windsow_                                                  	  //                                                                              
    //       .map_canvas_                                                      	  //                                                                              
    //       status -> (add_point,add_polygon,add_polyline,selection,select)      //                                                                              
    //																			                                      //
    ////////////////////////////////////////////////////////////////////////////////

    

    function CartoMap (latlng,zoom) {
      this.center_ = latlng;                          // Center of the map at the beginning
      this.zoom_ = zoom;                              // Zoom at the beginning
      this.bounds_ = new google.maps.LatLngBounds();  // A latlngbounds for the map
      this.query_mode = false;						            // Query mode
      this.editing = false;                           // User editing?

      this.points_ = {};                              // Points belong to the map
      this.fakeMarker_ = null;
      this.fakeGeometries_ = null;

      this.status_ = "select";                        // Status of the map (select, add, )
      this.columns_ = null;
      this.cache_buster = 0;

      this.show();                                    // First step is show the map canvas
      this.createMap();                               // Create the map
    }



    ////////////////////////////////////////
    //  INIT MAP						              //
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
      this.startWax();
      
      // Get the styles predefine for this table
      this.getStyles();
    }



    ////////////////////////////////////////
    //  ADD ALL NECESSARY OVERLAYS		    //
    ////////////////////////////////////////
    CartoMap.prototype.addMapOverlays = function () {
      var me = this;

      head.js('/javascripts/admin/maps/Overlays/mapCanvasStub.js',
        '/javascripts/admin/maps/Overlays/CartoTooltip.js',
        '/javascripts/admin/maps/Overlays/CartoInfowindow.js',
        '/javascripts/admin/maps/Overlays/CartoDeleteWindow.js',
        '/javascripts/admin/maps/polygonEdit.js',
        '/javascripts/admin/maps/polylineEdit.js',
        '/javascripts/admin/maps/geometryCreator.js',
        function(){
          me.selection_area_    = new google.maps.Polygon({strokeWeight:1});                          // Selection polygon area
          me.info_window_       = new CartoInfowindow(new google.maps.LatLng(-260,-260),me.map_);     // InfoWindow for markers
          me.tooltip_           = new CartoTooltip(new google.maps.LatLng(-260,-260),me.map_);		    // Over tooltip for markers and selection area
          me.delete_window_     = new CartoDeleteWindow(new google.maps.LatLng(-260,-260), me.map_);  // Delete window to confirm remove one/several markers
          me.map_canvas_ 	    	= new mapCanvasStub(me.map_);                                        // Canvas to control the coordinates
        }
      );
    }



    ////////////////////////////////////////
    //  GET / SET MAP STYLES    		      //
    ////////////////////////////////////////
    // Get the styles of the whole map
    CartoMap.prototype.getStyles = function() {
      var me = this,
          map_style,
          layers_style,
          geom_type,
          infowindow_info,
          ajax_count = 4;
      
      
      var setupTools = _.after(ajax_count, function() {me.setupTools(geom_type,layers_style,map_style,infowindow_info)});
      
      
      // Get map style
      $.ajax({
        url: global_api_url + 'tables/' + table_id + '/map_metadata',
        type: "GET",
        dataType: 'jsonp',
        headers: {"cartodbclient":"true"},
        success:function(result){
          if (result.map_metadata != null) {
            map_style = $.parseJSON(result.map_metadata);
          } else {
            map_style = {basemap_provider: 'google_maps',google_maps_customization_style:[],google_maps_base_type:'cartodb'}
          }
          setupTools();
        },
        error: function(e){
          setupTools();
          console.debug(e);
        }
      });



      // Get geom type
      $.ajax({
        type: "GET",
        dataType: 'jsonp',
        url: global_api_url+'queries?sql='+escape('SELECT type from geometry_columns where f_table_name = \''+table_name+'\' and f_geometry_column = \'the_geom\''),
        headers: {"cartodbclient":"true"},
        success: function(data) {          
          if (data.rows.length>0) {
            geom_type = me.geometry_type_ = data.rows[0].type.toLowerCase();
          } else {
            geom_type = undefined;
          }
          
          setupTools();
        },
        error: function(e) {
          setupTools();
          console.debug(e);
        }
      });


      // Get tiles style
      $.ajax({
        url:TILEHTTP + '://' + user_name + '.' + TILESERVER + '/tiles/' + table_name + '/style?map_key='+map_key,
        type: 'GET',
        dataType: 'jsonp',
        success: function(result) {
          layers_style = result.style;
          setupTools();
        },
        error:function(e) {
          setupTools();
          console.debug(e);
        } 
      });
      
      
      // Get saved infowindow variables
      $.ajax({
        url:TILEHTTP + '://' + user_name + '.' + TILESERVER + '/tiles/' + table_name + '/infowindow?map_key='+map_key,
        type: "GET",
        dataType: 'jsonp',
        headers: {"cartodbclient":"true"},
        success: function(result){
          infowindow_info = $.parseJSON(result.infowindow);
          setupTools();
        },
        error: function(e) {
          setupTools();
          console.debug(e);
        }
      });
      
    }
    
    // Set new tile styles
    CartoMap.prototype.setTilesStyles = function(obj) {
      var me = this,
          str = '';
      
      if (typeof obj === "string") {
        str = obj.replace(/\n/g,'');
      } else {
        str = '#'+table_name+' {';
        _.each(obj,function(property,i){
          if (property!=undefined)
            str += i+':'+property+'; ';
        });
        str += '}';
      }
      
      $.ajax({
        type: 'POST',
        url:TILEHTTP + '://' + user_name + '.' + TILESERVER + '/tiles/' + table_name + '/style?map_key='+map_key,
        data: {style:str},
        success: function(result) {
	     		$('.cartocss_editor span.errors').hide();
          me.refreshWax();
        },
        error:function(e) {
					var errors = JSON.parse(e.responseText);
					var msg = '';
					_.each(errors,function(ele,i){msg += ele + ' ';});
					$('.cartocss_editor span.errors p').text(msg);
					$('.cartocss_editor span.errors').css({display:'block'});
        }
      });
    }

    // Set new map style
    CartoMap.prototype.setMapStyle = function(map_styles,map_properties) {
      // Compose array for map style      
      var styles = [];
      var type = ''
            
      if (map_styles.type!="roadmap") {
        _.each(map_styles,function(value,style){
          if (style=="roads" || style=="labels") {
            if (style=="roads") {
              styles.push({featureType:'road',stylers:[{visibility:((value)?'on':'off')}]});
            } else {
              styles.push({featureType:'administrative',stylers:[{visibility:((value)?'on':'off')}]});
              styles.push({featureType:'poi',elementType:"labels",stylers:[{visibility:((value)?'on':'off')}]});
              styles.push({featureType:'transit',stylers:[{visibility:((value)?'on':'off')}]});
              styles.push({featureType:'water',elementType:"labels",stylers:[{visibility:((value)?'on':'off')}]});
              styles.push({featureType:'landscape',elementType:"labels",stylers:[{visibility:((value)?'on':'off')}]});            
            }
          } else if (style=="saturation") {
            styles.push({stylers:[{saturation:value}]});
          } else {
            type = value;
          }
        });
        this.map_.setOptions({styles:styles});
      } else {
				styles = [ { stylers: [ { saturation: map_styles.saturation }, { gamma: 1.52 } ] }, { featureType: "administrative", stylers: [ { saturation: -95 },{ gamma: 2.26 } ] }, { featureType: "water", elementType: "labels", stylers: [ { visibility: "off" } ] }, { featureType: "administrative.locality", stylers: [ { visibility: ((map_styles.labels)?'on':'off') } ] }, { featureType: "road", stylers: [ { visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 } ] }, { featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ] }, { featureType: "road.arterial", stylers: [ { visibility: ((map_styles.roads)?'on':'off') } ] }, { featureType: "road.local", elementType: "labels", stylers: [ { visibility: ((map_styles.roads)?'on':'off') } ] }, { featureType: "transit", stylers: [ { visibility: ((map_styles.roads)?'on':'off') } ] }, { featureType: "road", elementType: "labels", stylers: [ { visibility: ((map_styles.roads)?'on':'off') } ] },{ featureType: "poi", stylers: [ { saturation: -55 } ] } ];
      	this.map_.setOptions({styles:styles});
			}

      
      // Save this object in the table
      $.ajax({
        type: "POST",
        headers: {"cartodbclient": true},
        url: global_api_url + 'tables/' + table_id + '/map_metadata',
        data: {map_metadata: JSON.stringify({basemap_provider: 'google_maps',google_maps_base_type:type,google_maps_customization_style: styles, latitude: map_properties.latitude, longitude:map_properties.longitude, zoom: map_properties.zoom})}
      });
    }

    // Set new infowindow vars    
    CartoMap.prototype.setInfowindowVars = function(infowindow_vars) {
      this.infowindow_vars_ = infowindow_vars;
      
      $.ajax({
        type: "POST",
        headers: {"cartodbclient": true},
        url: global_api_url + 'tables/' + table_id + '/infowindow',
        data: {infowindow: JSON.stringify(infowindow_vars)}
      });
    }



    ////////////////////////////////////////
    //  MAP AND TOOLS         			      //
    ////////////////////////////////////////
    /* Event listeners of the map */
    CartoMap.prototype.addMapListeners = function() {
      var me = this;

      google.maps.event.addListener(this.map_, 'click', function(ev) {
        if (me.status_=="add_point") {
          // Was a double click?
          if (me.double_click) {
            me.double_click = !me.double_click;
            return false;
          }
          me.addMarker(ev.latLng, {lat_:ev.latLng.lat(), lon_:ev.latLng.lng()}, true);
        }
      });
      
      google.maps.event.addListener(this.map_, 'dblclick', function(ev) {
        me.double_click = true;
      });

			google.maps.event.addListener(this.map_, 'zoom_changed', function() {
        $('span.slider').slider('value',me.map_.getZoom());
      });
    }

    /* Event listeners of the map tools */
    CartoMap.prototype.addToolListeners = function() {
      var me = this;

      // Map tools
      $('div.general_options ul li.map a').hover(function(){
        if (!$(this).parent().hasClass('disabled')) {
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
        } else {
          $('div.general_options div.tooltip').hide();
        }
      },function(){
        $('div.general_options div.tooltip').hide();
      });

      // Change map status
      $('div.general_options ul li.map a').click(function(ev){
        stopPropagation(ev);
        if (!$(this).parent().hasClass('selected') && !$(this).parent().hasClass('disabled')) {
          var status = $(this).attr('class');
          me.setMapStatus(status);
        }
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
      // Clear
      $('a.clear_table').livequery('click',function(ev){
        var view_map = ($('body').attr('view_mode') == 'map');
        if (view_map) {
          stopPropagation(ev);
          $('body').removeAttr('query_mode');
          me.query_mode = false;
					$('.map_header div.stickies').remove();
          me.refresh();
        }
      });

      // Try query
      $('div.sql_window a.try_query').livequery('click',function(ev){
        var map_status = ($('body').attr('view_mode') == "map");
        if (map_status) {
          stopPropagation(ev);
					me.closeMapWindows();

          $('body').attr('query_mode','true');
          me.query_mode = true;
          setAppStatus();
          me.refresh();
          
          var requestId = createUniqueId();
          requests_queue.newRequest(requestId,'query_table');

          // Get results from api
          $.ajax({
            method: "GET",
            url: global_api_url+'queries?sql='+escape(editor.getValue().replace('/\n/gi'," ")),
            headers: {"cartodbclient":"true"},
            success: function(data) {
  			      // Remove error content
  						$('div.sql_window span.errors').hide();
  						$('div.sql_window div.inner div.outer_textarea').css({bottom:'50px'});
  						$('div.sql_window').css({'min-height':'199px'});
  						
  						$('span.query h3').html(data.total_rows + ' row' + ((data.total_rows>1)?'s':'') + ' matching your query <a class="clear_table" href="#clear">CLEAR VIEW</a>');
  						$('span.query p').text('This query took '+data.time.toFixed(3)+' seconds');
							$('.map_header div.stickies').remove();
							$('div.map_header').append('<div class="stickies"><p><strong>'+data.total_rows+' result'+((data.total_rows>1)?'s':'')+'</strong> - Read-only. <a class="open_console" href="#open_console">Change your query</a> or <a class="clear_table" href="#disable_view">clear view</a></p></div>');
  						
  						requests_queue.responseRequest(requestId,'ok','');
  			    },
  			    error: function(e) {
              requests_queue.responseRequest(requestId,'error','Query error, see details in the sql window...');
  			      $(document).unbind('arrived');

  			      var errors = $.parseJSON(e.responseText).errors;
  			      $('div.sql_window span.errors p').text('');
  			      _.each(errors,function(error,i){
  			        $('div.sql_window span.errors p').append(' '+error+'.');
  			      });

  			      var new_bottom = 65 + $('div.sql_window span.errors').height();
  			      $('div.sql_window div.inner div.outer_textarea').css({bottom:new_bottom+'px'});

  			      var new_height = 199 + $('div.sql_window span.errors').height();
  			      $('div.sql_window').css({'min-height':new_height+'px'});
  			      $('div.sql_window span.errors').show();
  			      $('.map_header div.stickies').remove();
  			      $('span.query h3').html('No results for this query <a class="clear_table" href="#clear">CLEAR VIEW</a>');
      				$('span.query p').text('');
  			    }
          });
        }
      });
  
			// Refresh after geolocating
			$('section.subheader div.performing_op p a.refresh').livequery('click',function(ev){
        ev.preventDefault();
				var view_mode = ($('body').attr('view_mode') === "map");
			  if (view_mode) {
					ev.stopPropagation();
	        me.refreshWax();
				}
      });
    }

    /* Set bbox for the map */
    CartoMap.prototype.zoomToBBox = function() {
      var me = this;
      $.ajax({
        method: "GET",
        url: global_api_url+'queries?sql='+escape('select ST_Extent(the_geom) from '+ table_name),
        headers: {"cartodbclient":"true"},
        success: function(data) {
          if (data.rows[0].st_extent!=null) {
            var coordinates = data.rows[0].st_extent.replace('BOX(','').replace(')','').split(',');
            
            var coor1 = coordinates[0].split(' ');
            var coor2 = coordinates[1].split(' ');
            var bounds = new google.maps.LatLngBounds();
            
            // Check bounds
            if (coor1[0] >  180 
             || coor1[0] < -180 
             || coor1[1] >  90 
             || coor1[1] < -90 
             || coor2[0] >  180 
             || coor2[0] < -180 
             || coor2[1] >  90  
             || coor2[1] < -90) {
              coor1[0] = '-30';
              coor1[1] = '-50'; 
              coor2[0] = '110'; 
              coor2[1] =  '80'; 
            }
            
            bounds.extend(new google.maps.LatLng(coor1[1],coor1[0]));
            bounds.extend(new google.maps.LatLng(coor2[1],coor2[0]));
                            
            me.map_.fitBounds(bounds);
            
            if (me.map_.getZoom()<2) {
              me.map_.setZoom(2);
            }
          }

        },
        error: function(e) {
        }
      });
    }

    /* Set the tools due to geom_type... */
    CartoMap.prototype.setupTools = function(geom_type,geom_styles,map_style,infowindow_vars) {
      var me = this;
      var map = me.map_;

			/* setup search */
			this.setupSearch();


      /* Visualization type - header*/
      var visualization_type = (function(){
        
        /*Geometry tools*/
        if (geom_type=="point" || geom_type=="multipoint") {
          $('div.map_window div.map_header ul li p:eq(1)').text('Point visualization');
        } else if (geom_type=="polygon" || geom_type=="multipolygon") {
          $('div.map_window div.map_header ul li p:eq(1)').text('Polygon visualization');
        } else {
          $('div.map_window div.map_header ul li p:eq(1)').text('Line visualization');
        }
        
        return {}
  		}());
         
      
      /*Map type - header*/
      var map_customization = (function(){
        var custom_map_style = {};
				var custom_map_properties = {};
	
	
        
				// Set map style
        map.setOptions({styles:map_style.google_maps_customization_style});
  
        // Parse the styles of the map
        custom_map_style = parseMapStyle(map_style.google_maps_customization_style);
        
        // Initialize radiobuttons and map type
        initializeMapOptions(custom_map_style,map_style.google_maps_base_type,map_style.google_maps_customization_style);


				/* Set up center and zoom*/
				if (map_style.zoom && map_style.latitude && map_style.longitude) {
					custom_map_properties.zoom = map_style.zoom;
					custom_map_properties.latitude = map_style.latitude;
					custom_map_properties.longitude = map_style.longitude;
					map.setCenter(new google.maps.LatLng(map_style.latitude,map_style.longitude));
					map.setZoom(map_style.zoom);
				} else {
					me.zoomToBBox();
				}

				/* Bind bounds changed on map to cartomap */
				google.maps.event.addListener(me.map_, 'dragend', function(ev) {
	        custom_map_properties.latitude = this.getCenter().lat();
	        custom_map_properties.longitude = this.getCenter().lng();
					me.setMapStyle(custom_map_style,custom_map_properties);
	      });
				google.maps.event.addListener(me.map_, 'zoom_changed', function(ev) {
	        custom_map_properties.zoom = this.getZoom();
					me.setMapStyle(custom_map_style,custom_map_properties);
	      });
	
	
  
        $('.map_header ul.map_type li a.option').livequery('click',function(ev){
          stopPropagation(ev);
          var parent = $(this).parent();
          if (!parent.hasClass('selected') && !parent.hasClass('disabled')) {
            if (parent.find('div.suboptions').length>0) {
              parent.addClass('special selected');
              return false;
            }
            // Get value
            var map_type = $(this).text();

            // Remove selected
            $('.map_header ul.map_type li').each(function(i,li){$(li).removeClass('selected special')});
            
            // Add selected to the parent (special?)
            parent.addClass('selected');
                                 
            // Do action
            if (map_type=="Satellite") {
              map.setOptions({mapTypeId: google.maps.MapTypeId.SATELLITE});
              $('.map_header ul.main li.first p').text('Satellite');
            } else if (map_type=="Terrain") {
              map.setOptions({mapTypeId: google.maps.MapTypeId.TERRAIN});
              $('.map_header ul.main li.first p').text('Terrain');
            } else {
              map.setOptions({mapTypeId: google.maps.MapTypeId.ROADMAP});
              $('.map_header ul.main li.first p').text('Roadmap');
            }
            
            custom_map_style.type = map_type.toLowerCase();
            me.setMapStyle(custom_map_style,custom_map_properties);
          }
        });
        
        
        /* saturation slider */
        $('.map_header ul.map_type div.suboptions span.alpha div.slider').slider({
          max:100,
          min:-100,
          range: "min",
          value: custom_map_style.saturation,
          slide: function(event,ui) {
            $(ui.handle).closest('span.alpha').find('span.tooltip')
              .css({left:$(ui.handle).css('left')})
              .text(ui.value)
              .show();
          },
          stop: function(event,ui) {
            $(ui.handle).closest('span.alpha').find('span.tooltip').hide();
            // Save the saturation value
            custom_map_style['saturation'] = ui.value;
            // Set the custom map styles
            me.setMapStyle(custom_map_style,custom_map_properties);
          }
        });
        
        
        /* roads/labels -> on/off*/
        $('.map_header ul.map_type div.suboptions span.radio a').click(function(ev) {
          stopPropagation(ev);
          
          if (!$(this).hasClass('clicked')) {
            // Change clicked class
            $(this).parent().find('a.clicked').removeClass('clicked');
            $(this).addClass('clicked');

            // Get the value
            var value = $(this).text().toLowerCase() == "yes";

            // Get the map css type
            var style = $(this).closest('span').attr('css');

            // Set value in the obj
            custom_map_style[style] = value;

            // Perform in the map
            me.setMapStyle(custom_map_style,custom_map_properties);
          }
        });
        
        
        
        // Setup custom map properties (roads, labels, saturation...)
        function parseMapStyle(map_style_) {
          var obj = {};
          
          // Gets road on/off
          var roads = _.detect(map_style_,function(ele,i){return ele.featureType == "road" && ele.stylers[0].visibility != "simplified"});
          if (roads != undefined) {
            obj.roads = roads.stylers[0].visibility == "on" || roads.stylers[0].visibility == "simplified";
          } else {
            obj.roads = true;
          }

          
          // Gets labels on/off
          var labels = _.detect(map_style_,function(ele,i){return ele.featureType == "administrative"});
          if (labels != undefined) {
            obj.labels = labels.stylers[0].visibility == "on";
          } else {
            obj.labels = true;
          }


					// Gets labels on/off on roadmap type?
          var labels = _.detect(map_style_,function(ele,i){return ele.featureType == "administrative.locality"});
          if (labels != undefined) {
            obj.labels = labels.stylers[0].visibility == "on";
          }
					
          
          // Saturation value
          var saturation = _.detect(map_style_,function(ele,i){return ele.stylers[0].saturation != undefined});
          if (saturation != undefined) {
            obj.saturation = saturation.stylers[0].saturation;
          } else {
            obj.saturation = 0;
          }
          
          return obj;
        }
        
        
        // Initialize the map controls and the map type
        function initializeMapOptions(map_style, map_type, stylers) {
          // select map type
          if (map_type=="terrain") {
            $('.map_header ul.map_type li a.option:contains("Terrain")').parent().addClass('selected');
            $('.map_header ul.main li.first p').text('Terrain');
            map.setOptions({mapTypeId: google.maps.MapTypeId.TERRAIN});
            custom_map_style.type = 'terrain';
          } else if (map_type=="satellite") {
            $('.map_header ul.map_type li a.option:contains("Satellite")').parent().addClass('selected');
            $('.map_header ul.main li.first p').text('Satellite');
            map.setOptions({mapTypeId: google.maps.MapTypeId.SATELLITE});
            custom_map_style.type = 'satellite';
          } else {
            map.setOptions({mapTypeId: google.maps.MapTypeId.ROADMAP});
            $('.map_header ul.map_type li a.option:contains("Roadmap")').parent().addClass('selected');
            $('.map_header ul.main li.first p').text('Roadmap');
            var mapStyles = stylers;
						if (mapStyles.length==0) {
							map_style.saturation = -65;
							map_style.roads = false;
							map_style.labels = false;
							mapStyles = [ { stylers: [ { saturation: map_style.saturation }, { gamma: 1.52 } ] }, { featureType: "administrative", stylers: [ { saturation: -95 },{ gamma: 2.26 } ] }, { featureType: "water", elementType: "labels", stylers: [ { visibility: "off" } ] }, { featureType: "administrative.locality", stylers: [ { visibility: ((map_style.labels)?'on':'off') } ] }, { featureType: "road", stylers: [ { visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 } ] }, { featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ] }, { featureType: "road.arterial", stylers: [ { visibility: ((map_style.roads)?'on':'off') } ] }, { featureType: "road.local", elementType: "labels", stylers: [ { visibility: ((map_style.roads)?'on':'off') } ] }, { featureType: "transit", stylers: [ { visibility: ((map_style.roads)?'on':'off') } ] }, { featureType: "road", elementType: "labels", stylers: [ { visibility: ((map_style.roads)?'on':'off') } ] },{ featureType: "poi", stylers: [ { saturation: -55 } ] } ];
						}
            map.setOptions({styles: mapStyles});
            custom_map_style.type = 'roadmap';
          }
          
          // change radio buttons
          $('.map_header ul.map_type div.suboptions span.radio[css="roads"]').find('a:contains('+((map_style.roads)?'YES':'NO')+')').addClass('clicked');
          $('.map_header ul.map_type div.suboptions span.radio[css="labels"]').find('a:contains('+((map_style.labels)?'YES':'NO')+')').addClass('clicked');
        }
        
        
        return {}
  		}());
      
      
      /*Geometry customization - header*/
      var geometry_customization = (function(){
        
        var geometry_style = {};
        var default_style = {};
        
        
        /* CARTOCSS WINDOW */
        // draggable
        $('div.cartocss_editor').draggable({containment:'parent'});
        
        // editor
        var cartocss_editor = CodeMirror.fromTextArea(document.getElementById("cartocss_editor"), {
  	      lineNumbers: false,
  	      mode: "css",
  				onKeyEvent: function(editor,event) {
  					if (event.ctrlKey && event.keyCode == 13 && event.type == "keydown") {
  						stopPropagation(event);
  						$('div.cartocss_editor a.try_css').trigger('click');
  					}
  				}
  	    });
  	    
  	    // Bindings
  	    $('div.cartocss_editor a.try_css').click(function(ev){
  	      stopPropagation(ev);
  	      me.setTilesStyles(cartocss_editor.getValue());
  	    });
  	    $('div.cartocss_editor a.close, div.cartocss_editor a.cancel').click(function(ev){
  	      stopPropagation(ev);
  	      $('div.cartocss_editor').fadeOut();
  	    });
  	    /*END CARTOCSS*/


        setupStyles(geom_styles);
        
        
        // BINDINGS
        /* change between list options */
        $('.map_header ul.geometry_customization li a.option').click(function(ev){
          stopPropagation(ev);
          var parent = $(this).parent();
          var type = $(this).text();
          if (!parent.hasClass('selected') && !parent.hasClass('disabled')) {
            // Remove selected
            $('.map_header ul.geometry_customization li').each(function(i,li){$(li).removeClass('selected special')});
            
            // Add selected to the parent (special?)
            if (parent.find('div.suboptions').length>0) {
              parent.addClass('selected special');
              $('.map_header ul.geometry_customization').closest('li').find('p').text((type=="CartoCSS")?'CartoCSS':'Custom Style');
            } else {
              parent.addClass('selected');
              resetStyles();
            }
          }
        });
              
              
        /* color input */
        $('.map_header ul.geometry_customization div.suboptions span.color input').change(function(ev){
          stopPropagation(ev);
          
          var color = new RGBColor($(this).val());
          if (color.ok) {
            var new_color = color.toHex();
            var css_ = $(this).closest('span.color').attr('css');
            $(this).parent().find('a.control').removeClass('error').css({'background-color':new_color});
            $(this).removeClass('error');
            geometry_style[css_] = new_color;
            me.setTilesStyles(geometry_style);
          } else {
            $(this).addClass('error');
            $(this).parent().find('a.control').removeAttr('style').addClass('error');
          }
        });
        
        
        /* color open palette */
        $('.map_header ul.geometry_customization div.suboptions span.color a.control').click(function(ev){
          stopPropagation(ev);
          $('.map_header span.color span.palette').each(function(i,palette){
            $(palette).hide();
          });
          $(this).closest('span.color').find('span.palette').show();
        });
        
        
        /* color palette */
        $('.map_header ul.geometry_customization div.suboptions span.color span.palette ul li a').click(function(ev){
          stopPropagation(ev);
          // Get the value
          var new_color = $(this).attr('href');
          
          // Hide the palette
          $(this).closest('span.palette').hide();
          
          // Save the new color
          $(this).closest('span.color').find('a.control').removeClass('error').css({'background-color':new_color});
          $(this).closest('span.color').find('input').val(new_color);
          $(this).removeClass('error');
          var css_ = $(this).closest('span.color').attr('css');
          geometry_style[css_] = new_color;
          me.setTilesStyles(geometry_style);
        });
        
        
        /* width range */
        var interval;
        $('.map_header ul.geometry_customization div.suboptions span.numeric a').livequery('click',function(ev){
          stopPropagation(ev);

          var old_value = $(this).parent().find('input').val(),
              add = ($(this).text()=="+")?true:false,
              that = this,
              css_ = $(that).closest('span').attr('css');
              
          
          if (add || old_value>0) {
						var value_ = parseInt(old_value) + ((add)?1:-1);
            $(that).parent().find('input').val(value_);
            
            clearInterval(interval);
            interval = setTimeout(function(){
              geometry_style[css_] = value_;
              me.setTilesStyles(geometry_style);
            },400);
          }
        });
        
        
        /* alpha slider */
        var slider_value = $('.map_header ul.geometry_customization div.suboptions span.alpha').attr('css').split(' ');
        slider_value = geometry_style[slider_value[0]]*100 || 100;
        $('.map_header ul.geometry_customization div.suboptions span.alpha div.slider').slider({
          max:100,
          min:0,
          range: "min",
          value: slider_value,
          slide: function(event,ui) {
            $(ui.handle).closest('span.alpha').find('span.tooltip')
              .css({left:$(ui.handle).css('left')})
              .text(ui.value+'%')
              .show();
          },
          stop: function(event,ui) {
            $(ui.handle).closest('span.alpha').find('span.tooltip').hide();
            
            // Save the values in the geom_style object
            var css_props = $(ui.handle).closest('span.alpha').attr('css').split(' ');
            _.each(css_props,function(value,i){
              geometry_style[value] = ui.value/100;
            });

            // Set style in the tiles finally
            me.setTilesStyles(geometry_style);
          }
        });
        
        
        /* open cartocss editor */
        $('.map_header ul.geometry_customization button').click(function(ev){
          stopPropagation(ev);
          $(this).closest('div.options').hide();
          $('div.cartocss_editor').fadeIn(function(){
            cartocss_editor.refresh();
          });
        });
        
        
        /* setup enter styles */
        function setupStyles(styles) {

          // Remove the customization that doesn't belong to the geom_type
         if (geom_type == 'multipoint' || geom_type == 'point') {
            $('.map_header ul.geometry_customization li a:contains("polygons")').parent().remove();
            $('.map_header ul.geometry_customization li a:contains("lines")').parent().remove();
            $('div.general_options ul li.map a.add_point').parent().removeClass('disabled');
            
            default_style = {
              'marker-fill':'#00ffff',
              'marker-opacity':1,
              'marker-width':9,
              'marker-line-color':'white',
              'marker-line-width':3,
              'marker-line-opacity':0.9,
              'marker-placement':'point',
              'marker-type':'ellipse',
              'marker-allow-overlap':true
            };

         } else if (geom_type == 'multipolygon' || geom_type == 'polygon') {
            $('.map_header ul.geometry_customization li a:contains("points")').parent().remove();
            $('.map_header ul.geometry_customization li a:contains("lines")').parent().remove();
            $('div.general_options ul li.map a.add_polygon').parent().removeClass('disabled');            

            default_style = {
              'polygon-fill':'#FF6600',
              'polygon-opacity': 0.7,
              'line-opacity':1,
              'line-color': '#FFFFFF',
              'line-width': 1
            };

          } else {
            $('.map_header ul.geometry_customization li a:contains("polygons")').parent().remove();
            $('.map_header ul.geometry_customization li a:contains("points")').parent().remove();
            $('div.general_options ul li.map a.add_polyline').parent().removeClass('disabled');
            
            default_style = {
              'line-color':'#FF6600',
              'line-width': 1,
              'line-opacity': 0.7
            };
          }


          // Get all the styles and save them in geometry_style object
          var styles_ = styles.replace(/ /gi,'').replace(/\n/g,'');
          
          // Setup cartocss editor
          cartocss_editor.setValue(styles_.replace(/\{/gi,'{\n   ').replace(/\}/gi,'}\n').replace(/;/gi,';\n   '));

          // Remove table_name
          styles_ = styles_.split('{');

          // Split properties
          styles_ = styles_[1].split(';');

          // Save each property removing white-spaces
          _.each(styles_,function(property,i){
            if (property!="}") {
              var split_property = property.split(':');
              geometry_style[split_property[0]] = split_property[1];
            }
          });


          // Change tools, we have to know if this styles have been edited or not...
          _.each(geometry_style,function(value,type){
            $('span[css="'+type+'"]').find('input').val(value);
            
            if (typeof(value) === "string") {
              var color = new RGBColor(value);
              if (color.ok) {
                $('span[css="'+type+'"] a.control').css({'background-color':value});
              }
            }
          });


          // Determinate if it is a customized style or default
          var is_default = true,
              cartocss = false;
          _.each(geometry_style,function(value,type){
            if (!cartocss && default_style[type]==undefined) {
              cartocss = true;
            }
            
            if (default_style[type]!=undefined && geometry_style[type] != default_style[type]) {
              is_default = false;
            } 
          });

          // if it is not default, select second option in the list, custom geometry style
          if (!is_default) {
            $('.map_header ul.geometry_customization > li').removeClass('selected');
            // if it is cartocss
            if (cartocss) {
              $('.map_header ul.geometry_customization > li:eq(2)').addClass('selected special');
              $('.map_header ul.geometry_customization').closest('li').find('p').text('Custom Style');
            } else {
              $('.map_header ul.geometry_customization li:eq(1)').addClass('selected special');
              $('.map_header ul.geometry_customization').closest('li').find('p').text('Custom Style');
            }
          }
        }


        /* reset styles to default */
        function resetStyles() {
          // Geom_types now is default_styles
          geometry_style = default_style;

          // Come back to defaults in the tools
          _.each(default_style,function(value,type){
            $('span[css="'+type+'"]').find('input').val(value);

            if (isNaN(value)) {
              var color = new RGBColor(value);
              if (color.ok) {
                $('span[css="'+type+'"] a.control').removeClass('error').css({'background-color':value});
              }
            }
          });

          // Reset slider
          var css_prop = $('.map_header ul.geometry_customization div.suboptions span.alpha').attr('css').split(' ')[0];
          $('.map_header ul.geometry_customization div.suboptions span.alpha div.slider').slider('value',default_style[css_prop]*100);

          // Change the text to "Default Style"
          $('.map_header ul.geometry_customization').closest('li').find('p').text('Default Style');

          // RefreshStyles
          me.setTilesStyles(geometry_style);
        }
        
        return {}
  		}());
      
      
      /*Setup infowindow - header*/
      this.setupInfowindow(infowindow_vars || {});
 
 
      /* Bind events for open and close any tool */
      $('.map_header a.open').livequery('click',function(ev){
        stopPropagation(ev);
        var options = $(this).parent().find('div.options');
        if (!options.is(':visible')) {
          me.closeMapWindows();
          me.bindMapESC();
          //If clicks out of the div...
          $('body').click(function(event) {
            if (!$(event.target).closest(options).length) {
              options.hide();
              me.unbindMapESC();
            };
          });
          options.show();
        } else {
          me.unbindMapESC();
          options.hide();
        }
      });
      $('.map_header span.tick').livequery('click',function(ev){
        stopPropagation(ev);
        var options = $(this).closest('div.options');
        if (options.is(':visible')) {
          me.unbindMapESC();
          options.hide();
        }
      });
      
      // All loaded? Ok -> Let's show options...
      $('.map_header a.open').fadeIn();
    }

    /* Show editing tools */
    CartoMap.prototype.toggleEditTools = function() {
      $('.general_options ul').animate({bottom:'-40px'},300,function(){
        $('.general_options ul li.map').each(function(i,ele){
          if (!$(ele).hasClass('disabled') && $(ele).hasClass('hidden')) {
            $(ele).removeClass('hidden');
            if ($(ele).children('a').hasClass('discard')) {
              $('.general_options ul li.all a').hide();
              $('.general_options ul').addClass('edit');
            }
            if ($(ele).children('a').hasClass('select')) {
              $('.general_options ul li.all a').show();
              $('.general_options ul').removeClass('edit');
            }
            return;
          }
          
          if (!$(ele).hasClass('disabled') && !$(ele).hasClass('hidden')) {
            $(ele).addClass('hidden');
            return;
          }

          $('.general_options ul').animate({bottom:'0px'},300);
        });
      });
    }

    /* Refresh infowindow customization due to adding/removing a column */
    CartoMap.prototype.setupInfowindow = function(infowindow_vars) {

      var me = this,
          custom_infowindow = infowindow_vars,
          default_infowindow = {};
      
      
      if (!infowindow_vars && !this.infowindow_vars_) {
        return false;
      } else {
        if (this.infowindow_vars_) {
          custom_infowindow = this.infowindow_vars_;
          setupVars(custom_infowindow);
          return false;
        }
      }

			
			$('.map_header ul.infowindow_customization div.suboptions span.info_tools a.mark_all,.map_header ul.infowindow_customization div.suboptions span.info_tools a.clear_all').livequery('click',function(ev){
        stopPropagation(ev);
        var bool = $(this).attr('class') === "mark_all";

				$('.map_header ul.infowindow_customization div.suboptions ul.column_names li.vars a').each(function(i,ele){
					var value = $(this).text();
					$(this).removeClass('on off');
					if (bool) {
						$(this).addClass('on');
					} else {
						$(this).addClass('off');
					}
					
					custom_infowindow[value] = bool;
				});

        me.setInfowindowVars(custom_infowindow);
      });

      
      $('.map_header ul.infowindow_customization div.suboptions ul.column_names li.vars a').livequery('click',function(ev){
        stopPropagation(ev);
        var value = $(this).text();
        
        if ($(this).hasClass('on')) {
          $(this).removeClass('on');
          custom_infowindow[value] = false;
        } else {
          $(this).addClass('on');
          custom_infowindow[value] = true;
        }
        
        me.setInfowindowVars(custom_infowindow);
      });
      
    
      $('.map_header ul.infowindow_customization li > a').livequery('click',function(ev){
        stopPropagation(ev);
        var parent = $(this).parent();
        if (!parent.hasClass('selected') && !parent.hasClass('disabled') && !parent.hasClass('vars')) {
          $('.map_header ul.infowindow_customization li').each(function(i,li){$(li).removeClass('selected special')});
          
          // Add selected to the parent (special?)
          if (parent.find('div.suboptions').length>0) {
            parent.addClass('selected special');
            $('.map_header ul.infowindow_customization').closest('li').find('p').text('Custom');
            me.setInfowindowVars(custom_infowindow);
          } else {
            $('.map_header ul.infowindow_customization').closest('li').find('p').text('Default');
            parent.addClass('selected');
            me.setInfowindowVars(default_infowindow);
          }
        }
      });


      // Setup the vars in the infowindow customization tool
      setupVars(custom_infowindow);
      
      
      function setupVars(infowindow_vars) {
        // Get the columns
        $.ajax({
			    method: "GET",
			    url: global_api_url + 'tables/' + table_name,
			 		headers: {"cartodbclient":"true"},
			    success: function(data) {

			      // Select the default or custom
			      $('.map_header ul.infowindow_customization li').removeClass('selected special');  		
			      if (_.size(infowindow_vars)==0) {
			        $('.map_header ul.infowindow_customization').closest('li').find('p').text('Default');
			        $('.map_header ul.infowindow_customization li:eq(0)').addClass('selected');
			      } else {
			        $('.map_header ul.infowindow_customization').closest('li').find('p').text('Custom');
			        $('.map_header ul.infowindow_customization li:eq(1)').addClass('selected special');  			        
			      }
			      
			      // Loop over all columns and saving each value that is not present
			      //   in the requested infowindow_vars
			      _.each(data.schema,function(arr,i) {
			        if (arr[0]!='cartodb_id') {
			          default_infowindow[arr[0]] = true;
			          if (infowindow_vars[arr[0]] == undefined) infowindow_vars[arr[0]] = true;
			        }
			      });
			      
			      
			      
			      
			      // Reinitialize jscrollpane in the infowindow
      	    var custom_scrolls = [];
         		$('.map_header ul.infowindow_customization div.suboptions ul.column_names').jScrollPane().data().jsp.destroy();

            // Remove the list items
      	    $('.map_header ul.infowindow_customization div.suboptions ul.scrollPane').html('');

			      // Print all possible items in the suboptions
			      _.each(infowindow_vars,function(value,name){
			        $('.map_header ul.infowindow_customization div.suboptions ul.column_names').append('<li class="vars"><a class="'+(value?'on':'')+'">'+name+'</a</li>');
      	    });

            // Initialize jscrollPane
            $('.map_header ul.infowindow_customization div.suboptions ul.scrollPane').jScrollPane({autoReinitialise:true,maintainPosition:false});

            me.infowindow_vars_ = infowindow_vars;
			    },
			    error: function(e) {
			      console.debug(e);
			      $('.map_header ul.infowindow_customization li:eq(1)').addClass('disabled');
			    }
			  });
      }

    }
    
		/* Search stuff on map */
		CartoMap.prototype.setupSearch = function() {
			var that = this;
			this.geocoder = new google.maps.Geocoder();
			
			$('form.map_search').submit(function(ev){
				ev.preventDefault();
				var address = $('form.map_search input[type="text"]').val();
				
				if (address.search(/santana/i)!=-1) {
					that.map_.setCenter(new google.maps.LatLng(41.70124284555466, -4.835700988769531));
					that.map_.setZoom(16);
					return false;
				}
				
				if (address.search(/jamon/i)!=-1) {
					that.map_.setCenter(new google.maps.LatLng(40.37740486883891, -3.7519919872283936));
					that.map_.setZoom(16);
					return false;
				}
				
				if (address.search(/vizzuality madrid/i)!=-1) {
					that.map_.setCenter(new google.maps.LatLng(40.4222095, -3.6996303));
					that.map_.setZoom(16);
					return false;
				}
				
				if (address.search(/vizzuality ny/i)!=-1) {
					that.map_.setCenter(new google.maps.LatLng(40.717147636174424, -74.00177657604218));
					that.map_.setZoom(16);
					return false;
				}
				
				if (address.search(/vizzuality/i)!=-1) {
					that.map_.setCenter(new google.maps.LatLng(40.4222095, -3.6996303));
					that.map_.setZoom(16);
					return false;
				}
				
	      that.geocoder.geocode( { 'address': address}, function(results, status) {
	        if (status == google.maps.GeocoderStatus.OK) {
	          that.map_.setCenter(results[0].geometry.location);
	          that.map_.fitBounds(results[0].geometry.bounds);
						$('form.map_search span.error').fadeOut();
	        } else {
	          $('form.map_search span.error').fadeIn(function(){$(this).delay(2000).fadeOut()});
	        }
	      });
			});
		}



    ////////////////////////////////////////
    //  WAX AND TOOLS LISTENERS			      //
    ////////////////////////////////////////
    CartoMap.prototype.startWax = function() {
      // interaction placeholder
      var me = this;
      var currentCartoDbId;
      this.tilejson = this.generateTilejson();
			this.current_pos = new google.maps.LatLng(0,0);
            
      this.waxOptions = {
        callbacks: {
          out: function(){
						$('div#map').unbind('mousemove');
						clearInterval(me.interval);
						setTimeout(function(){
							if (!me.over_tooltip) {
								me.tooltip_.hide();
							}
						},100);
            me.over_marker = false;
            me.map_.setOptions({draggableCursor: 'default'});
          },
          over: function(feature, div, opt3, evt){
            if (me.query_mode || me.status_ == "select") {
		
							// Reset map events
							$('div#map').unbind('mousemove');
							clearInterval(me.interval);
							
							// Bind features over events
					    $('div#map').mousemove(function(ev){
								me.current_pos = me.map_canvas_.transformCoordinates(new google.maps.Point(ev.pageX,ev.pageY));
							});
							me.interval = setInterval(function(){
								if (!me.over_tooltip) {
									me.tooltip_.setPosition(me.current_pos,feature);
								}
							},150);
							
              me.over_marker = true;
              me.map_.setOptions({ draggableCursor: 'pointer' });
              me.tooltip_.open(evt.latLng,feature);
            }
          },
          click: function(feature, div, opt3, evt){
            setTimeout(function(){
              if (me.query_mode || me.status_ == "select") {
                // Was a double click?
                if (me.double_click) {
                  me.double_click = !me.double_click;
                  return false;
                }
                me.info_window_.open(feature,evt.pixel,null);
                me.hideOverlays();
              }
            },200);

          }
        },
        clickAction: 'full'
      };

      this.wax_tile = new wax.g.connector(this.tilejson);
      this.map_.overlayMapTypes.insertAt(0,this.wax_tile);
      this.interaction = wax.g.interaction(this.map_, this.tilejson, this.waxOptions);
    }

    /* Reduce opacity wax again */
    CartoMap.prototype.fadeOutWax = function() {

    }

    /* Full of opacity wax again */
    CartoMap.prototype.fadeInWax = function() {

    }

    /* Refresh wax tiles */
    CartoMap.prototype.refreshWax = function() {
      // Add again wax layer
      if (this.map_) {
        // update tilejson with cache buster
        this.cache_buster++;
        this.map_.overlayMapTypes.clear();

        this.tilejson.grids = wax.util.addUrlData(this.tilejson.grids_base,  'cache_buster=' + this.cache_buster);

        // add map tiles
        this.wax_tile = new wax.g.connector(this.tilejson);
        this.map_.overlayMapTypes.insertAt(0,this.wax_tile);

        // add interaction
        this.interaction.remove();
        this.interaction = wax.g.interaction(this.map_, this.tilejson, this.waxOptions);
      }
    }

    /* Remove WAX layer */
    CartoMap.prototype.removeWax = function() {
      if (this.map_) {
        this.map_.overlayMapTypes.clear();
      }
    }

    /* Generate another tilejson */
    CartoMap.prototype.generateTilejson = function() {
      var that = this;

      // Base Tile/Grid URLs
      var core_url = TILEHTTP + '://' + user_name + '.' + TILESERVER 
      var base_url = core_url + '/tiles/' + table_name + '/{z}/{x}/{y}';
      var tile_url = base_url + '.png?cache_buster={cache}';  //gotta do cache bust in wax for this
      var grid_url = base_url + '.grid.json';

      // Add map keys to base urls
      tile_url = wax.util.addUrlData(tile_url, 'map_key=' + map_key);
      grid_url = wax.util.addUrlData(grid_url, 'map_key=' + map_key);

      // SQL?
      if (this.query_mode) {
        var query = 'sql=' + editor.getValue();
        tile_url = wax.util.addUrlData(tile_url, sanitizeQuery(query));
        grid_url = wax.util.addUrlData(grid_url, sanitizeQuery(query));
      }

      // Build up the tileJSON
      // TODO: make a blankImage a real 'empty tile' image
      return {
        blankImage: core_url + '/images/admin/map/blank_tile.png8', 
        tilejson: '1.0.0',
        scheme: 'xyz',
        tiles: [tile_url],
        grids: [grid_url],
        tiles_base: tile_url,
        grids_base: grid_url,
        formatter: function(options, data) {
            currentCartoDbId = data.cartodb_id;
            return data.cartodb_id;
        },
        cache_buster: function(){
            return that.cache_buster;
        }
      };
    }



    ////////////////////////////////////////
    //  SET MAP && MARKER STATUS		      //
    ////////////////////////////////////////
    /* Set map status */
    CartoMap.prototype.setMapStatus = function(status) {

      this.status_ = status;

      $('div.general_options li.map').each(function(i,ele){
          $(ele).removeClass('selected');
      });
      $('div.general_options li.map a.'+status).parent().addClass('selected');

      // New special geometry (multipolygon or multipolyline==multilinestring)
     if (status == "add_polygon" || status == "add_polyline") {
        this.geometry_creator_ = new GeometryCreator(this.map_,(this.status_=="add_polygon")?"MultiPolygon":"MultiLineString");
      }

      this.hideOverlays()
    }



    ////////////////////////////////////////
    //  DRAW MARKERS WITH CANVAS ASYNC	  //
    ////////////////////////////////////////
    CartoMap.prototype.createFakeGeometry = function(feature) {
      var me = this;
      this.removeFakeGeometries();
      this.toggleEditTools();
      
      if (this.geometry_type_ == 'point') {
        this.addFakeMarker(feature);
     } else if (this.geometry_type_ == 'multipolygon' || this.geometry_type_ == 'polygon') {
        this.addFakePolygons(feature);
      } else {
        this.addFakePolylines(feature);
      }
      
      // Bind edit tools
      $('.general_options ul li.edit a.complete').unbind('click');
      $('.general_options ul li.edit a.discard').unbind('click');

      // Bind links
      $('.general_options ul li.edit a.complete').click(function(ev){
        stopPropagation(ev);
        me.editing = false;
        if (me.fakeGeometries_ && me.fakeGeometries_.length>0) {
          me.updateGeometry(me.fakeGeometries_,me.geometry_type_,me.fakeGeometries_[0].data);
        } else {
          me.removeFakeGeometries();
          me.refreshWax();
        }
        $('.general_options ul li.map a.select').click();
        me.toggleEditTools();
      });

      $('.general_options ul li.edit a.discard').click(function(ev){
        stopPropagation(ev);
        me.editing = false;
        $('.general_options ul li.map a.select').click();
        me.toggleEditTools();
        me.removeFakeGeometries();
        me.refreshWax();
      });
      
      this.editing = true;
    }
    
    /* Remove all fake overlays */
    CartoMap.prototype.removeFakeGeometries = function() {
      // Point
      if (this.fakeMarker_!=null) {
        this.fakeMarker_.setMap(null);
        this.fakeMarker_ = null;
      }

      // Polygons or polylines
      if (this.fakeGeometries_!=null) {
        _.each(this.fakeGeometries_,function(geometry,i){
          geometry.setMap(null);
          geometry.stopEdit();
        });
      }
    }
    
    /* Add fake google marker to the map */
    CartoMap.prototype.addFakeMarker = function(feature) {
      var me = this;

      $.ajax({
          method: "GET",
          url:global_api_url + 'tables/'+table_name+'/records/'+feature,
          headers: {"cartodbclient": true},
          success:function(data){
            me.removeWax();

            var coordinates = $.parseJSON(data.the_geom).coordinates;
            var latlng = new google.maps.LatLng(coordinates[1],coordinates[0]);

            var image = new google.maps.MarkerImage(me.generateDot('#FF6600'),
              new google.maps.Size(20, 20),
              new google.maps.Point(0,0),
              new google.maps.Point(10, 10));

            var marker = new google.maps.Marker({
              position: latlng,
              icon: image,
              flat: true,
              clickable: true,
              draggable: true,
              raiseOnDrag: false,
              animation: false,
              map: me.map_,
              data: data
            });


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
              me.toggleEditTools();
              me.marker_dragging_ = false;
              var occ_id = this.data.cartodb_id;
              var params = {};
              params.the_geom = '{"type":"Point","coordinates":['+ev.latLng.lng()+','+ev.latLng.lat()+']}';
              params.cartodb_id = occ_id;
              me.updateTable('/records/'+occ_id,params,ev.latLng,this.data.init_latlng,"update_geometry","PUT");
            });


            google.maps.event.addListener(marker,'click',function(ev){
              ev.stopPropagation();
              if (me.status_=="select") {
                  me.info_window_.open(this,null);
              }
            });


            // Click on map to recover wax layer and remove marker
            google.maps.event.addListener(me.map_,'click',function(ev){
              me.fakeMarker_.setMap(null);
              me.fakeMarker_ = null;

              // Refresh tiles
              me.refreshWax();
            });

            me.fakeMarker_ = marker;
          },
          error:function(e){}
      });


    }

    /* Add fake google polygons to the map */
    CartoMap.prototype.addFakePolygons = function(feature) {
      var me = this;
      this.fakeGeometries_ = new Array();
      
      
      // Get number of vertex
      $.ajax({
        type: "GET",
        dataType: 'jsonp',
        url: global_api_url+'queries?sql='+escape('SELECT npoints(the_geom) from '+table_name+' WHERE cartodb_id='+feature),
        headers: {"cartodbclient":"true"},
        success: function(data) {
          var count = data.rows[0].npoints;
          if (count>2000) {
            me.showBigBang();
          } else {
            getGeometryData(feature);
          }
        },
        error: function(e) {
          getGeometryData(feature);
        }
      });
      
      // Draw the geometry 
      function getGeometryData(feature) {
        $.ajax({
          method: "GET",
          url:global_api_url + 'tables/'+table_name+'/records/'+feature,
          headers: {"cartodbclient": true},
          success:function(data){
            me.removeWax();      
            // Get polygons coordinates
            var poly_obj = transformGeoJSON(data.the_geom);
            
            // Draw the polygon
            _.each(poly_obj.paths,function(path,i){
              path.pop();
              var polygon = new google.maps.Polygon({paths:path,strokeColor:"#FFFFFF",strokeOpacity:1,strokeWeight:2,fillColor:"#FF6600",fillOpacity:0.5,map:me.map_,clickable:false,data:feature});
              me.fakeGeometries_.push(polygon);
              polygon.runEdit();
            });
          },
          error:function(e){}
        });
      }
    }
    
    /* Add fake google polylines to the map */
    CartoMap.prototype.addFakePolylines = function(feature) {     
      var me = this;
      this.fakeGeometries_ = new Array();
      
      // Get number of vertex
      $.ajax({
        type: "GET",
        dataType: 'jsonp',
        url: global_api_url+'queries?sql='+escape('SELECT npoints(the_geom) from '+table_name+' WHERE cartodb_id='+feature),
        headers: {"cartodbclient":"true"},
        success: function(data) {
          var count = data.rows[0].npoints;
          if (count>2000) {
            me.showBigBang();
          } else {
            getGeometryData(feature);
          }
        },
        error: function(e) {
          getGeometryData(feature);
        }
      });
      
      
      function getGeometryData(feature) {
        $.ajax({
          method: "GET",
          url:global_api_url + 'tables/'+table_name+'/records/'+feature,
          headers: {"cartodbclient": true},
          success:function(data){
            me.removeWax();
          
            // Get polygons coordinates and data
            var poly_obj = transformGeoJSON(data.the_geom);
            _.each(poly_obj.paths,function(path,i){
              var polyline = new google.maps.Polyline({path:path,strokeColor:"#FF6600",strokeOpacity:1,strokeWeight:2,map:me.map_,clickable:false,data:feature});
              me.fakeGeometries_.push(polyline);
              polyline.runEdit();
            });
          
          },
          error:function(e){}
        });
      }
    }

    /* Add record to database */
    CartoMap.prototype.addMarker = function(latlng) {
      var params = {};
      params.the_geom = '{"type":"Point","coordinates":['+latlng.lng()+','+latlng.lat()+']}';
      this.updateTable('/records',params,latlng,null,"adding","POST");
    }

    /* Add geometry to database */
    CartoMap.prototype.updateGeometry = function(geometries,type,cartodb_id) {
      var params = {};
      params.the_geom = transformToGeoJSON(geometries,type);
      params.cartodb_id = cartodb_id;
      this.updateTable('/records/'+params.cartodb_id,params,params.the_geom,null,"update_geometry","PUT");
    }

    /* Generate canvas image to fill marker */
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

    /* Remove the geometries */ 
    CartoMap.prototype.removeGeometries = function(cartodb_ids) {
      var params = {};
      params.cartodb_ids = cartodb_ids;
      this.updateTable('/records/'+cartodb_ids,params,null,null,"remove_points","DELETE");
    }

    /* Show Big Bang error window due to edition of huge polygon */
    CartoMap.prototype.showBigBang = function(cartodb_ids) {
      // Out table&map window binding
      closeOutTableWindows();
      $('div.mamufas div.stop_window h5').text('Sorry, this geometry is too big to edit in browser');
      $('div.mamufas div.stop_window p').text('We\'re working on ways to improve this, but in the meantime you can edit the geometry via our API.');
      $('div.mamufas div.stop_window').show();
      $('div.mamufas').fadeIn('fast');
      bindESC();
      
      this.editing = false;
      $('.general_options ul li.map a.select').click();
      this.toggleEditTools();
      this.removeFakeGeometries();
      this.refreshWax();
    }
      
      
    
    ////////////////////////////////////////
    //  CLOSE OUT TABLE WINDOWS && ESC    //
    ////////////////////////////////////////
    // Bind ESC key
  	CartoMap.prototype.bindMapESC = function() {
  	  var me = this;
      $(document).keydown(function(event){
        if (event.which == '27') {
          me.closeMapWindows();
        }
      });
    }

    // Unind ESC key
    CartoMap.prototype.unbindMapESC = function() {
      $(document).unbind('keydown');
      $('body').unbind('click');
      this.closeMapWindows();
    }
    
  	// Close all map elements
    CartoMap.prototype.closeMapWindows = function() {
      // Tools windows
      $('.map_header ul.main li div.options').each(function(i,ele){
        $(this).hide();
      });
      
      // Close palettes
      $('.map_header span.palette').each(function(i,ele){
        $(this).hide();
      });
      
      // Close Infowindow
      this.info_window_.hide();

      //popup windows
      $('div.mamufas').fadeOut('fast',function(){
        $(document).unbind('keydown');
        $('body').unbind('click');
      });
    }



    ////////////////////////////////////////
    //  REFRESH / CLEAR / CLEAN OVERLAYS  //
    ////////////////////////////////////////
    /* Reset map */
    CartoMap.prototype.refresh = function(sql) {
      this.query_mode = ($('body').attr('query_mode') === 'true');
      $('body').attr('view_mode','map');

      // Refresh wax layer
      this.tilejson = this.generateTilejson();
      this.refreshWax();
      
      // Check if there was any change in the table to composite 
      //    the infowindow vars customization properly
      this.setupInfowindow();

      // Remove the fake marker
      if (this.fakeMarker_!=null)
          this.fakeMarker_.setMap(null);
    }

    /* Hide all overlays (no markers) */
    CartoMap.prototype.hideOverlays = function() {
      // Tooltips
      this.delete_window_.hide();
      this.info_window_.hide();
      this.tooltip_.hide();
    }



    ////////////////////////////////////////
    //  HIDE OR SHOW THE MAP LOADER		    //
    ////////////////////////////////////////
    CartoMap.prototype.hideLoader = function() {
      $('div.loading').fadeOut();
    }

    CartoMap.prototype.showLoader = function() {
      $('div.loading').fadeIn();
    }



    ////////////////////////////////////////
    //  HIDE OR SHOW MAP				          //
    ////////////////////////////////////////
    CartoMap.prototype.hide = function() {
      // Remove all things
      if (this.editing) {
        this.editing = false;
        this.toggleEditTools();
        this.removeFakeGeometries();
        if (this.geometry_creator_!=null)
          this.geometry_creator_.destroy();
      }
      
      this.closeMapWindows();
      $('div.map_window div.map_curtain').show();
    }

    CartoMap.prototype.show = function() {
      $('div.map_window div.map_curtain').hide();
      this.refresh();
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
      var me = this;
      switch (type) {
        case "update_geometry": me.refreshWax();
                                me.removeFakeGeometries();
                                break;
        case "adding":          me.refreshWax();
                                break;
        case "add_polygon":     me.refreshWax();
                                break;
        case "remove_points":   me.refreshWax();
                                break;
        default:                break;
      }
    }

    /* If request fails */
    CartoMap.prototype.errorRequest = function(params,new_value,old_value,type) {
      switch (type) {
        case "change_latlng":   var occ_id = params.cartodb_id;
                                (this.points_[occ_id]).setPosition(old_value);
                                break;
        case "remove_row":      var array = (params.cartodb_ids).split(',');
                                var me = this;
                                _.each(array,function(ele,i){
                                    me.points_[ele].setMap(me.map_);
                                });
                                break;
        default:                break;
      }
    }
