
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
      this.query_mode = ($('body').hasClass('query'));
      $('body').addClass('map');

      this.addMapOverlays();
      this.addMapListeners();
      this.addToolListeners();

      // Get the styles predefine for this table
      this.getStyles();
    }



    ////////////////////////////////////////
    //  ADD ALL NECESSARY OVERLAYS		    //
    ////////////////////////////////////////
    CartoMap.prototype.addMapOverlays = function () {
      var me = this;

      head.js('/javascripts/admin/show/map/overlays/mapCanvasStub.js',
        '/javascripts/admin/show/map/overlays/CartoTooltip.js',
        '/javascripts/admin/show/map/overlays/CartoInfowindow.js',
        '/javascripts/admin/show/map/overlays/CartoDeleteWindow.js',
        '/javascripts/admin/show/map/tools/polygonEdit.js',
        '/javascripts/admin/show/map/tools/polylineEdit.js',
        '/javascripts/admin/show/map/tools/geometryCreator.js',
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
    //  GET / SAVE MAP STYLES    		      //
    ////////////////////////////////////////
    // Get all the styles of the map
    CartoMap.prototype.getStyles = function() {
      var me = this,
          map_style,
          layers_style,
          geom_type,
          infowindow_info,
          style_info,
          properties,
          ajax_count = 4;
      
      
      var setupTools = _.after(ajax_count, function(){
        me.setVisualization(geom_type,layers_style);      // Show the correct tiles
        me.setMapStyle(geom_type,map_style);              // Set map styles
        me.setupInfowindow(infowindow_info || {});        // Set infowindow vars
        if (!map_style)                                   // If fails getting map variables, show the tiles wax!
          me.startWax();                                  // Prevent requesting tiles from two different locations and zooms...
      });
      
      
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
        url: global_api_url+'queries?sql='+escape('SELECT type as geom_type FROM geometry_columns where "f_table_name" = \''+ table_name +'\' AND "f_geometry_column" = \'the_geom\''),
        headers: {"cartodbclient":"true"},
        success: function(data) {
          if (data.rows.length>0 && 
              data.rows[0].geom_type!=undefined &&
              data.rows[0].geom_type!=null &&
              data.rows[0].geom_type.toLowerCase()!= "geometry") {
            geom_type = me.geometry_type_ = data.rows[0].geom_type.toLowerCase();
            setupTools();
          } else {
            // Attempt to work out geometry based on data contents
            $.ajax({
              type: "GET",
              dataType: 'jsonp',
              url: global_api_url+'queries?sql='+escape('SELECT DISTINCT(GeometryType(the_geom)) as geom_type FROM '+table_name+' GROUP BY geom_type'),
              headers: {"cartodbclient":"true"},
              success: function(data) {
                if (data.rows.length>0 && 
                    data.rows[0].geom_type!=undefined &&
                    data.rows[0].geom_type!=null &&
                    data.rows[0].geom_type.toLowerCase()!= "geometry") {
                  geom_type = me.geometry_type_ = data.rows[0].geom_type.toLowerCase();
                } else {
                  // FIXME: This forces table to be points when geometry_columns returns 'geometry' and the table is empty.
                  // breaks things if data type is actually not point
                  geom_type = 'point';
                }
                setupTools();
              },
              error: function(e) {
                geom_type = 'point';
                setupTools();
                console.debug(e);
              }
            });
          }
        },
        error: function(e) {
          geom_type = 'point';
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
          me.styles = result.style;
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
    CartoMap.prototype.saveTilesStyles = function(prop, vis_data) {
      var me = this,
          str = '';

      // Carto directly
      if (typeof prop === "string") {
        str = prop.replace(/\n/g,'');
      } else {
        // Feature - Custom - Color
        str = '#'+table_name+' {';
        _.each(prop,function(property,i){
          if (property!=undefined)
            str += i+':'+property+'; ';
        });
        str += '}';

        if (vis_data && vis_data.type=="custom") {

          for (var i=vis_data.v_buckets.length - 1; i>=0; i--) {
            str += '#'+table_name+' ['+vis_data.column+ '<=' + (vis_data.v_buckets[i]) +'] {';
            str += vis_data.param + ':' + vis_data.values[i] || vis_data.values[vis_data.values.length-1];
            str += '}';
          }
          
        } else if (vis_data && vis_data.type=="color") {
          // PENDING
        }
      }

      // Set carto style
      if (str.search('/*carto*/') < 0) {
        this.css_editor.setValue(
          str.replace(/\n/g,'')
          .replace(/\{\n?\s*/g,'{\n   ')
          .replace(/;\n?\s*/g,';\n   ')          
          .replace(/\s*\}/gi,'\n}\n')
          .replace(/\/\*carto\*\//g,'')
        );
      }

      // Save styles to "this" object -> Refresh tiles
      this.styles = str;

      this.postStyles(str,true);
    }

    // Ajax to save the styles
    CartoMap.prototype.postStyles = function(str,refresh) {
      var me = this;

      $.ajax({
        type: 'POST',
        url:TILEHTTP + '://' + user_name + '.' + TILESERVER + '/tiles/' + table_name + '/style?map_key='+map_key,
        data: {style:str},
        success: function(result) {
          $('.cartocss_editor').removeClass('error');
          $('.cartocss_editor').find('.outer_textarea').removeAttr('style');
          if (refresh)
            me.refreshWax();
        },
        error:function(e) {
          var errors = JSON.parse(e.responseText);
          var msg = '';
          _.each(errors,function(ele,i){msg += ele + '<br/>';});
          $('.cartocss_editor span.errors p').html(msg);

		      var errors_height = (errors.length * 16) + 23;
		      $('.cartocss_editor').find('.outer_textarea').css({'bottom':errors_height+'px'});
		      $('.cartocss_editor').addClass('error');
        }
      });
    }

    // Set new map style
    CartoMap.prototype.saveMapStyle = function(map_styles,map_properties) {
      // Compose array for map style      
      var styles = [];
      var type = '';
            
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
    CartoMap.prototype.saveInfowindowVars = function(infowindow_vars) {
      this.infowindow_vars_ = infowindow_vars;
      
      $.ajax({
        type: "POST",
        headers: {"cartodbclient": true},
        url: global_api_url + 'tables/' + table_id + '/infowindow',
        data: {infowindow: JSON.stringify(infowindow_vars)}
      });
    }



    ////////////////////////////////////////
    //  MAP AND TOOLS LISTENERS        		//
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

      /* setup search */
      this.setupSearch();

      /* Bind events for open and close any tool */
      $('.map_header a.open').live('click',function(ev){
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
      $('.map_header span.tick').live('click',function(ev){
        stopPropagation(ev);
        var options = $(this).closest('div.options');
        if (options.is(':visible')) {
          me.unbindMapESC();
          options.hide();
        }
      });



      // Map tools
      $('div.general_options ul li.map a').hover(function(){
        if (!$(this).parent().hasClass('disabled') && $(this).text()!='Carto') {
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
      $('a.clear_table').live('click',function(ev){
        var map_mode = ($('body').hasClass('map'))
        	, query_mode = ($('body').hasClass('query'));

			  if (map_mode) {
			    stopPropagation(ev);
			    if (query_mode) {
			    	$('body').removeClass('query');

			    	// Reset sql window if there was any problem
			    	$('div.sql_window').removeClass('error');
			    	$('div.sql_window div.outer_textarea').removeAttr('style');
			    	delete editor['errors'];

          	me.query_mode = false;
						$('.map_header div.stickies').remove();
          	setAppStatus();
          	me.refresh();
          }
			  }
      });

      // Try query
      $('div.sql_window a.try_query').live('click',function(ev){
        var view_map = ($('body').hasClass('map'));
        if (view_map) {
          stopPropagation(ev);
					me.closeMapWindows();

          $('body').addClass('query');
          me.query_mode = true;
					
					// Set the new value to the editor
					editor.setOption('query',editor.getValue());

          // Add history to sql editor
          editor.addHistory();

          setAppStatus();
          me.refresh();
          
          var requestId = createUniqueId();
          window.ops_queue.newRequest(requestId,'query_table');

          // Get results from api
          $.ajax({
            method: "GET",
            url: global_api_url+'queries?sql='+encodeURIComponent(editor.getValue().replace('/\n/gi'," ")),
            headers: {"cartodbclient":"true"},
            success: function(data) {
  			      // Remove error content
  						$('div.sql_window').removeClass('error');
  						$('div.sql_window div.inner div.outer_textarea').removeAttr('style');

  						// Remove errors from the editor
  						delete editor['errors'];
  						
  						$('span.query h3').html(data.total_rows + ' row' + ((data.total_rows>1)?'s':'') + ' matching your query <a class="clear_table" href="#clear">CLEAR VIEW</a>');
  						$('span.query p').text('This query took '+data.time.toFixed(3)+' seconds');
							$('.map_header div.stickies').remove();
							$('div.map_header').append('<div class="stickies"><p><strong>'+data.total_rows+' result'+((data.total_rows>1)?'s':'')+'</strong> - Read-only. <a class="open_console" href="#open_console">Change your query</a> or <a class="clear_table" href="#disable_view">clear view</a></p></div>');
  						
  						window.ops_queue.responseRequest(requestId,'ok','');
  			    },
  			    error: function(e) {
              window.ops_queue.responseRequest(requestId,'error','Query error, see details in the sql window...');
  			      $(document).unbind('arrived');

  			      // parse errors
  			      var errors = $.parseJSON(e.responseText).errors;

  			      // set errors in the editor
  			      editor['errors'] = errors;
  			      
  			      $('div.sql_window span.errors p').text('');
  			      
			      	_.each(errors,function(error,i){
			        	$('div.sql_window span.errors p').append(''+error+'.<br/>');
			      	});

							$('div.sql_window').addClass('error');
				      $('div.sql_window div.inner div.outer_textarea').css({bottom:$('div.sql_window span.errors').outerHeight() +'px'});				      

  			      $('.map_header div.stickies').remove();
  			      $('span.query h3').html('No results for this query <a class="clear_table" href="#clear">CLEAR VIEW</a>');
      				$('span.query p').text('');
  			    }
          });
        }
      });
      
  		// Refresh after geolocating
  		$('section.subheader div.performing_op p a.refresh').live('click',function(ev){
        ev.preventDefault();
  			var view_map = ($('body').hasClass('map'));
  		  if (view_map) {
  				ev.stopPropagation();
          me.refreshWax();
  			}
      });
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

    /* Update tools from a change */
    CartoMap.prototype.updateTools = function() {
      
      // Set previous tile styles to new table ??
      if (this.styles) {
        this.postStyles(this.styles.replace(/#(\w*)\s/g,'#' + table_name));

      // Update column tools in any case
      var columns = getColumns(table_name);
      $('div.map_header').find('span.dropdown').each(function(i,el){
        if (!$(el).hasClass('buckets')) {
          $(el).customDropdown('update',columns);
        }
      });


      // Update Carto with the name of the new table
      this.css_editor.setValue(
        this.styles
          .replace(/\n/g,'')
          .replace(/#(\w*)\s/g,'#' + table_name + ' ')
          .replace(/\{\n?\s*/g,'{\n   ')
          .replace(/;\n?\s*/g,';\n   ')          
          .replace(/\s*\}/gi,'\n}\n')
          .replace(/\/\*carto\*\//g,'')
        ); 
      }
    }

    /* Search stuff on map */
    CartoMap.prototype.setupSearch = function() {
      var that = this;
      this.geocoder = new google.maps.Geocoder();
      
      $('form.map_search').submit(function(ev){
        ev.preventDefault();
        var address = $('form.map_search input[type="text"]').val();
        
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

    /* Set map status */
    CartoMap.prototype.setMapStatus = function(status) {

      // If carto, don't change the status!
      if (status == "carto") {return false}

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
    //  MAP HELPERS                     //
    ////////////////////////////////////////
    /* Set bbox for the map */
    CartoMap.prototype.zoomToBBox = function(corners) {

      // If request getCartoDBBox, get from helpers
      if (!corners) {
        gettingTableBounds(table_name,window.map.carto_map.zoomToBBox);
      } else {
        if (!$.isEmptyObject(corners)) {
          var bounds = new google.maps.LatLngBounds(corners.sw, corners.ne);

          window.map.carto_map.map_.fitBounds(bounds);
            
          if (window.map.carto_map.map_.getZoom()<2) {
            window.map.carto_map.map_.setZoom(2);
          }
        }
        window.map.carto_map.startWax();
      }
    }
    


    ///////////////////////////////////////////////////////////////
    //  SET MAP, INFOWINDOW && TILES CUSTOMIZATION               //
    ///////////////////////////////////////////////////////////////
    /* Set the tools due to geom_type... */

    /* Set visualization of the tiles */
    CartoMap.prototype.setVisualization = function(geom_type, styles) {
      /* Visualization type - header*/
      var that = this;

      var $vis_ul = $('.map_header ul.visualization_type')
        , prev_properties = cartoToJavascript(styles);        // Get previous properties, important!
      
      /*
        LIST HEADER VISUALIZATION
      */
      var visualization_header = (function() {
        _setCorrectGeomType(geom_type)

        function _setCorrectGeomType(geom_type) {
          if (geom_type=="linestring" || geom_type=="multilinestring") {
            $vis_ul.find('> li:eq(0) > div.suboptions.polygons, > li:eq(0) > div.suboptions.points').remove();
            $vis_ul.find('div.suboptions.choropleth span.color').remove();
            $vis_ul.find('div.suboptions.choropleth span.numeric').css({margin:'0'});
            $vis_ul.find('> li:eq(0) > a.option').text('Custom lines');
          } else if (geom_type=="polygon" || geom_type=="multipolygon") {
            $vis_ul.find('> li:eq(0) > div.suboptions.points, > li:eq(0) > div.suboptions.lines').remove();
            $vis_ul.find('> li:eq(0) > a.option').text('Custom polygons');
          } else {
            $vis_ul.find('> li:eq(0) > div.suboptions.polygons, > li:eq(0) > div.suboptions.lines').remove();
            $vis_ul.find('> li:eq(0) > a.option').text('Custom points');
            $vis_ul.find('> li:eq(2)').remove();
          }
        }
        return {}
			}());


      /*
        GEOMETRY OPTIONS
      */
      var geometry_options = (function() {
        _setCorrectGeomType(geom_type)

        function _setCorrectGeomType(geom_type) {
          if (geom_type=="point" || geom_type=="multipoint") {
            $('div.general_options ul li.map a.add_point').parent().removeClass('disabled');
          } else if (geom_type=="polygon" || geom_type=="multipolygon") {
            $('div.general_options ul li.map a.add_polygon').parent().removeClass('disabled');
          } else {
            $('div.general_options ul li.map a.add_polyline').parent().removeClass('disabled');
          }
        }
        return {}
			}());


      /*
        FEATURES
      */
      var features = (function() {

        var $feature      = $vis_ul.find('> li:eq(0) div.suboptions')
          , feature_props = {}; 

        
        _init();

          function _init() {
            _setProperties(prev_properties.properties);
            _initElements();
            _bindEvents();

            if (prev_properties.type == "features") {
              _activate();
            }
          }

          function _setProperties(old_properties) {


            // Get editable variables (Looping through the $el)
            $feature.find('span[css]').each(function(i,ele){

              // Get css value
              var css_ = $(ele).attr('css').split(' ');


              // Change default value if there was a previous one
              if (old_properties[css_[0]]) 
                $(ele).attr('default',old_properties[css_[0]]);

              var def_ = $(ele).attr('default');

                // If there are more properties in the same span
              _.each(css_,function(param,i){
                feature_props[param] = def_;
              });
            });


            // Get default variables depending on geom type
            if (geom_type=="point" || geom_type=="multipoint") {
              feature_props['marker-placement'] = 'point';
              feature_props['marker-type'] = 'ellipse';
              feature_props['marker-allow-overlap'] = true;
            } else if (geom_type=="polygon" || geom_type=="multipolygon") {
              // No more properties are needed
            } else {
              feature_props['line-opacity'] = feature_props['line-opacity'] || 1;
            }
          }


          function _initElements() {
            // Color inputs
            $feature.find('span.color').each(function(i,el){
              // Get one css element
              var property = $(el).attr('css').split(' ')[0];

              $(el).colorPicker({
                value: feature_props[property]
              })
              .bind('change.colorPicker',function(ev,value){
                _.each($(this).attr('css').split(' '),function(ele,i){
                  feature_props[ele] = value;
                });
                _saveProperties();
              });
            });


            // Alpha sliders
            $feature.find('span.alpha').each(function(i,el){
              // Get one css element
              var property = $(el).attr('css').split(' ')[0];

              $(el).customSlider({
                value: feature_props[property]*100
              })
              .bind('change.customSlider',function(ev,value){
                _.each($(this).attr('css').split(' '),function(ele,i){
                  feature_props[ele] = value / 100;
                });
                _saveProperties();
              });
            });


            // Range inputs
            $feature.find('span.numeric').each(function(i,el){
              var type = $(el).attr('class').replace('numeric','').replace(' ','')
                , property = $(el).attr('css').split(' ')[0]
                , value = feature_props[property];
              

              $(el).rangeInput({
                type: $(el).attr('css').replace('numeric','').replace(' ',''),
                value: value
              })
              .bind('change.rangeInput',function(ev,value){
                _.each($(this).attr('css').split(' '),function(ele,i){
                  feature_props[ele] = value;
                });
                _saveProperties();
              });
            });
          }


          function _bindEvents() {
            $feature.closest('li').find('> a.option').click(_activate);
          }


          function _activate(ev) {
            if (ev) {
              ev.preventDefault();
            }

            // Remove all selected 
            var parent = $feature.parent();
            if (!parent.hasClass('selected') && !parent.hasClass('disabled')) {
              $vis_ul.find('li.selected').removeClass('selected special')
              parent.addClass('selected special');
              if (ev)
                _saveProperties()
            }

            if (geom_type=="point" || geom_type=="multipoint") {
              $('div.map_window div.map_header ul li p:eq(1)').text('Point visualization');
            } else if (geom_type=="polygon" || geom_type=="multipolygon") {
              $('div.map_window div.map_header ul li p:eq(1)').text('Polygon visualization');
            } else {
              $('div.map_window div.map_header ul li p:eq(1)').text('Line visualization');
            }
          }

          function _saveProperties() {
            that.saveTilesStyles(feature_props);
          }

        return {
            
        }
      }());


      /*
        BUBBLES
      */
      var bubbles = (function() {

        var $bubbles     	= $vis_ul.find('> li:eq(1) div.suboptions')
          , custom_props  = {}
          , custom_vis    = {};

        _init();
        

          function _init() {
            _setProperties(prev_properties);
            _initElements();
            _bindEvents();

            if (prev_properties.properties['marker-type'] && prev_properties.type == "custom") {
              _activate();
            }
          }

          function _setProperties(old_properties) {

            // Get editable variables (Looping through the $el)
            $bubbles.find('span[css]').each(function(i,ele){

              // Get css value
              var css_ = $(ele).attr('css').split(' ');


              // Change default value if there was a previous one
              if (old_properties.properties[css_[0]]) 
                $(ele).attr('default',old_properties.properties[css_[0]]);

              var def_ = $(ele).attr('default');

                // If there are more properties in the same span
              _.each(css_,function(param,i){
                custom_props[param] = def_;
              });
            });

            // Set marker options from the beginning
            custom_props['marker-placement'] = 'point';
            custom_props['marker-type'] = 'ellipse';
            custom_props['marker-allow-overlap'] = true;              

            // Get visualization variables
            custom_vis['column'] = (isNaN(old_properties.visualization.column)) ? old_properties.visualization.column : 'cartodb_id';
            custom_vis['param'] = 'marker-width';
            custom_vis['v_buckets'] = old_properties.visualization.v_buckets || [0,1,2,3,4,5,6,7,8,9];
            custom_vis['n_buckets'] = 10;
            custom_vis['values'] = (old_properties.visualization.values && typeof old_properties.visualization.values[0] == 'integer') ? old_properties.visualization.values : [4,5,6,7,8,9,10,11,12,13];

            // Set type
            custom_vis['type'] = 'custom';
          }


          function _initElements() {
            // Color inputs
            $bubbles.find('span.color').each(function(i,el){
              // Get one css element
              var property = $(el).attr('css').split(' ')[0];

              $(el).colorPicker({
                value: custom_props[property]
              })
              .bind('change.colorPicker',function(ev,value){
                _.each($(this).attr('css').split(' '),function(ele,i){
                  custom_props[ele] = value;
                });
                _saveProperties();
              });
            });


            // Alpha sliders
            $bubbles.find('span.alpha').each(function(i,el){
              // Get one css element
              var property = $(el).attr('css').split(' ')[0];

              $(el).customSlider({
                value: custom_props[property]*100
              })
              .bind('change.customSlider',function(ev,value){
                _.each($(this).attr('css').split(' '),function(ele,i){
                  custom_props[ele] = value / 100;
                });
                _saveProperties();
              });
            });


            // Range inputs
            $bubbles.find('span.numeric').each(function(i,el){
              var type = $(el).attr('class').replace('numeric','').replace(' ','')
                , property = $(el).attr('css') || $(el).attr('data')
                , value = 0;

              if (type=='') {
                value = custom_props[property];
              } else {
                var length = custom_vis[property].length
                  , values = custom_vis[property];

                if (type=="max") {
                  value = values[length-1]
                } else {
                  value = values[0]
                }
              }

              $(el).rangeInput({
                type: type,
                value: value
              })
              .bind('change.rangeInput',function(ev,value){
                
                if (!$(this).hasClass('min') && !$(this).hasClass('max')) {
                  _.each($(this).attr('css').split(' '),function(ele,i){
                    custom_props[ele] = value;
                  });
                } else {
                  var values = custom_vis[$(this).attr('data')]
                    , max , min
                    , length = values.length - 1;

                  if ($(this).hasClass('max')) {
                    max = value;
                    min = parseInt(values[0]);
                  } else {
                    min = value;
                    max = parseInt(values[length])
                  }

                  // Create the values
                  var step = (max - min) / 9
                    , new_values = [];
                  
                  new_values.push(min);

                  for (var i = 1, l = 10; i<l+1; i++) {
                    new_values.push((step*i) + min);
                  }

                  new_values.push(max);
                  custom_vis[$(this).attr('data')] = new_values;
                }

                _saveProperties();
              });
            });


            // Dropdowns
            $bubbles.find('span.dropdown').each(function(i,el){

              if (!$(el).hasClass('buckets')) {
                // Column dropdown
                $(el).customDropdown({
                  source: getColumns(table_name),
                  unselect: 'Select a column',
                  value: custom_vis[$(el).attr('data')]
                })
                .bind('change.customDropdown',function(ev,value){
                  custom_vis['column'] = value;

                  custom_vis['v_buckets'] = [];

                  // Create the buckets
                  _.each(getColumnRange(value,custom_vis['n_buckets']),function(ele,pos){
                    (custom_vis['v_buckets']).push(ele.maxamount);
                  });

                  _saveProperties();
                });
              } else {
                // Buckets dropdown
                $(el).customDropdown({
                  unselect: 'Select a bucket',
                  value: custom_vis[$(el).attr('data')].length
                })
                .bind('change.customDropdown',function(ev,value){

                  custom_vis['n_buckets'] = value;
                  custom_vis['v_buckets'] = [];

                  // Create the buckets
                  _.each(getColumnRange(custom_vis['column'],value),function(ele,pos){
                    (custom_vis['v_buckets']).push(ele.maxamount);
                  });

                  $bubbles.find('span.color_ramp').colorRamp('update',value);
                });
              }
            });
          }



          function _bindEvents() {
            $bubbles.closest('li').find('> a.option').click(_activate);
          }


          function _activate(ev) {
            if (ev) {
              ev.preventDefault();
            }

            // Remove all selected
            var parent = $bubbles.parent();
            if (!parent.hasClass('selected') && !parent.hasClass('disabled')) {
              $vis_ul.find('li.selected').removeClass('selected special')
              parent.addClass('selected special');
              if (ev)
                _saveProperties();
            }

            $('div.map_window div.map_header ul li p:eq(1)').text('Bubble map');
          }

          function _saveProperties() {
            that.saveTilesStyles(custom_props,custom_vis);
          }

        return {
            
        }
      }());


			/*
        CHOROPLETHAS
      */
      var choroplethas = (function() {

        var $choroplethas = $vis_ul.find('> li:eq(2) div.suboptions')
          , custom_props  = {}
          , custom_vis    = {};


        if ($choroplethas.length>0) 
        	_init();
        
          function _init() {
            _setProperties(prev_properties);
            _initElements();
            _bindEvents();

            if (!prev_properties.properties["marker-type"] && prev_properties.type == "custom") {
              _activate();
            }
          }

          function _setProperties(old_properties) {

            // Get editable variables (Looping through the $el)
            $choroplethas.find('span[css]').each(function(i,ele){

              // Get css value
              var css_ = $(ele).attr('css').split(' ');


              // Change default value if there was a previous one
              if (old_properties.properties[css_[0]]) 
                $(ele).attr('default',old_properties.properties[css_[0]]);

              var def_ = $(ele).attr('default');

                // If there are more properties in the same span
              _.each(css_,function(param,i){
                custom_props[param] = def_;
              });
            });

            // Get default variables depending on geom type (only for lines)
            if (geom_type!="polygon" && geom_type!="multipolygon") {
              custom_props['line-width'] = '4';
              delete custom_props['polygon-opacity'];
            }


            // Get visualization variables
            if (geom_type=="polygon" || geom_type=="multipolygon") {
              custom_vis['param'] = 'polygon-fill';
            } else {
              custom_vis['param'] = 'line-color';
            }


            custom_vis['column'] = (isNaN(old_properties.visualization.column)) ? old_properties.visualization.column : 'cartodb_id';
            custom_vis['v_buckets'] = 
            	(old_properties.visualization.v_buckets &&
            		old_properties.visualization.v_buckets.length<8 &&
            		old_properties.visualization.v_buckets.length>2 ) ? old_properties.visualization.v_buckets : [0,2,4,12,24];
						custom_vis['n_buckets'] = 
            	(old_properties.visualization.values && 
            		old_properties.visualization.values.length<8 &&
            		old_properties.visualization.values.length>2 ) ? old_properties.visualization.values.length : 5;
            custom_vis['values'] = 
            	(old_properties.visualization.values &&
            		old_properties.visualization.values.length<8 &&
            		old_properties.visualization.values.length>2 &&
                old_properties.visualization.v_buckets.length == old_properties.visualization.values.length) ? old_properties.visualization.values : ['#EDF8FB', '#B2E2E2', '#66C2A4', '#2CA25F', '#006D2C'];

            // Set type
            custom_vis['type'] = 'custom';
          }


          function _initElements() {
            // Color inputs
            $choroplethas.find('span.color').each(function(i,el){
              // Get one css element
              var property = $(el).attr('css').split(' ')[0];

              $(el).colorPicker({
                value: custom_props[property]
              })
              .bind('change.colorPicker',function(ev,value){
                _.each($(this).attr('css').split(' '),function(ele,i){
                  custom_props[ele] = value;
                });
                _saveProperties();
              });
            });


            // Alpha sliders
            $choroplethas.find('span.alpha').each(function(i,el){
              // Get one css element
              var property = $(el).attr('css').split(' ')[0];

              $(el).customSlider({
                value: custom_props[property]*100
              })
              .bind('change.customSlider',function(ev,value){
                _.each($(this).attr('css').split(' '),function(ele,i){
                  if ((geom_type=="linestring" || geom_type=="multilinestring") && ele == "polygon-opacity") {
										delete custom_props[ele];
                  } else {
                    custom_props[ele] = value / 100;                  	
                  }
                });
                _saveProperties();
              });
            });


            // Range inputs
            $choroplethas.find('span.numeric').each(function(i,el){
              var type = $(el).attr('class').replace('numeric','').replace(' ','')
                , property = $(el).attr('css') || $(el).attr('data')
                , value = 0;

              if (type=='') {
                value = custom_props[property];
              } else {
                var length = custom_vis[property].length
                  , values = custom_vis[property];

                if (type=="max") {
                  value = values[length-1]
                } else {
                  value = values[0]
                }
              }

              $(el).rangeInput({
                type: type,
                value: value
              })
              .bind('change.rangeInput',function(ev,value){
                
                if (!$(this).hasClass('min') && !$(this).hasClass('max')) {
                  _.each($(this).attr('css').split(' '),function(ele,i){
                    custom_props[ele] = value;
                  });
                } else {
                  var values = custom_vis[$(this).attr('data')]
                    , max , min
                    , length = values.length - 1;

                  if ($(this).hasClass('max')) {
                    max = value;
                    min = parseInt(values[0]);
                  } else {
                    min = value;
                    max = parseInt(values[length])
                  }

                  // Create the values
                  var step = (max - min) / 9
                    , new_values = [];
                  
                  new_values.push(min);

                  for (var i = 1, l = 10; i<l+1; i++) {
                    new_values.push((step*i) + min);
                  }

                  new_values.push(max);
                  custom_vis[$(this).attr('data')] = new_values;
                }

                _saveProperties();
              });
            });


            // Dropdowns
            $choroplethas.find('span.dropdown').each(function(i,el){

              if (!$(el).hasClass('buckets')) {
                // Column dropdown
                $(el).customDropdown({
                  source: getColumns(table_name),
                  unselect: 'Select a column',
                  value: custom_vis[$(el).attr('data')]
                })
                .bind('change.customDropdown',function(ev,value){
                  custom_vis['column'] = value;

                  custom_vis['v_buckets'] = [];

                  // Create the buckets
                  _.each(getColumnRange(value,custom_vis['n_buckets']),function(ele,pos){
                    (custom_vis['v_buckets']).push(ele.maxamount);
                  });

                  _saveProperties();
                });
              } else {
                // Buckets dropdown
                $(el).customDropdown({
                  unselect: 'Select a bucket',
                  value: custom_vis[$(el).attr('data')].length
                })
                .bind('change.customDropdown',function(ev,value){

                  custom_vis['n_buckets'] = value;
                  custom_vis['v_buckets'] = [];

                  // Create the buckets
                  _.each(getColumnRange(custom_vis['column'],value),function(ele,pos){
                    (custom_vis['v_buckets']).push(ele.maxamount);
                  });

                  $choroplethas.find('span.color_ramp').colorRamp('update',value);
                });
              }
            });


            // Color ramps
            $choroplethas.find('span.color_ramp').each(function(i,el){
              $(el).colorRamp({
                value: custom_vis[$(el).attr('data')],
                buckets: custom_vis['n_buckets']
              })
              .bind('change.colorRamp',function(ev,values){
                custom_vis['values'] = values;
                _saveProperties();
              });
            });
          }



          function _bindEvents() {
            $choroplethas.closest('li').find('> a.option').click(_activate);
          }


          function _activate(ev) {
            if (ev) {
              ev.preventDefault();
            }

            // Remove all selected
            var parent = $choroplethas.parent();
            if (!parent.hasClass('selected') && !parent.hasClass('disabled')) {
              $vis_ul.find('li.selected').removeClass('selected special')
              parent.addClass('selected special');
              if (ev)
                _saveProperties();
            }

            if (geom_type=="polygon" || geom_type=="multipolygon") {
              $('div.map_window div.map_header ul li p:eq(1)').text('Numeric choropleth');
            } else {
              $('div.map_window div.map_header ul li p:eq(1)').text('Numeric choropleth');
            }
          }

          function _saveProperties() {
            that.saveTilesStyles(custom_props,custom_vis);
          }

        return {}
      }());


      /*
        COLOR
      */
      var color = (function() {
        var $color      = $vis_ul.find('> li:eq(2)')
          , color_props = {}; 

        
        _init();

          function _init() {
            //_setProperties(prev_properties.properties);
            //_initElements();
            _bindEvents();

            // if (prev_properties.type == "features") {
            //   $feature.parent().addClass('selected special');
            // }
          }

          function _setProperties() {}


          function _initElements() {}


          function _bindEvents() {
            $color.find('> a.option').click(_activate);
          }


          function _activate(ev) {

            if (ev) {
              ev.preventDefault();
              ev.stopPropagation();
            }

            // Remove all selected 
            // var parent = $color.parent();
            // if (!parent.hasClass('selected') && !parent.hasClass('disabled')) {
            //   $vis_ul.find('li.selected').removeClass('selected special')
            //   parent.addClass('selected special');
            //   _saveProperties()
            // }
          }

          function _saveProperties() {
            //that.saveTilesStyles(feature_props);
          }

        return {}
      }());


      /*
        CARTO
      */
      var carto = (function() {

        var $carto = $('div.cartocss_editor'),
            $carto_editor;

        _init();
        

          function _init() {
            _initElements();
            _setProperties(prev_properties);
            _bindEvents();

            if (prev_properties.type == "carto") {
              _activate();
            }
          }


          function _setProperties(old_properties) {
            var old_value = old_properties.visualization.style.replace(/\{/gi,'{\n   ').replace(/\}/gi,'}\n').replace(/;/gi,';\n   ');
            $carto_editor.setValue(
              old_value
                .replace(/\n/g,'')
                .replace(/\{\n?\s*/g,'{\n   ')
                .replace(/;\n?\s*/g,';\n   ')          
                .replace(/\s*\}/gi,'\n}\n')
                .replace(/\/\*carto\*\//g,'')
            );
            $carto_editor.historyArray.push(old_value);
          }


          function _initElements() {
            // editor
            $carto_editor = CodeMirror.fromTextArea(document.getElementById("cartocss_editor"), {
              lineNumbers: false,
              lineWrapping: true,
              mode: "css",
              onKeyEvent: function(editor,event) {
                if (event.ctrlKey && event.keyCode == 13 && event.type == "keydown") {
                  stopPropagation(event);
                  _saveProperties();
                }
              }
            });

            that.css_editor = $carto_editor;

            $carto_editor.historyArray = new Array();
            $carto_editor.historyIndex = 0;
          }


          function _bindEvents() {

            // Draggable
            $carto
            	.draggable({containment:'parent',handle:'h3'})
            	.resizable({maxWidth:600,maxHeight:600});
            
            /* open cartocss editor */
            $('.general_options.map li a.carto').click(function(ev){
              stopPropagation(ev);
              if (!$carto.is(':visible')) {
                that.closeMapWindows();
                that.bindMapESC();
                $carto.fadeIn(function(){$carto_editor.refresh();});
              } else {
                that.closeMapWindows();
                that.unbindMapESC();
              }
            });

            /* close */
            $carto.find('a.close').click(function(ev){
              stopPropagation(ev);
              that.closeMapWindows();
            });

            /* try */
            $carto.find('a.try_css').click(_activate);


            // UNDO - REDO
            $carto.find('span.history a.undo').on('click', function (ev) {
              stopPropagation(ev);
              if ($(this).hasClass('active') && $carto_editor.historyIndex>0 && $carto_editor.historyArray.length>0) {
                $carto_editor.historyIndex--;
                $carto_editor.setValue($carto_editor.historyArray[$carto_editor.historyIndex]);
                if ($carto_editor.historyIndex < 1) {
                  $(this).removeClass('active');
                }
                $carto.find('span.history a.redo').addClass('active');
              }
            });

            $carto.find('span.history a.redo').on('click', function (ev) {
              stopPropagation(ev);
              if ($(this).hasClass('active') && $carto_editor.historyIndex<$carto_editor.historyArray.length-1) {
                $carto_editor.historyIndex++;
                $carto_editor.setValue($carto_editor.historyArray[$carto_editor.historyIndex]);

                if ($carto_editor.historyIndex == ($carto_editor.historyArray.length - 1)) {
                  $(this).removeClass('active');
                }

                $carto.find('span.history a.undo').addClass('active');
              }
            });

            $carto.find('a.redo,a.undo').hover(
              function(){
                var position = $(this).position().left;
                $(this)
                  .closest('span.history')
                  .find('div.tooltip p')
                  .text($(this).attr('class').replace('active',''))
                  .parent()
                  .css({left: position - 10 + 'px'})
                  .show();
              },
              function() {
                $(this).closest('span.history').find('div.tooltip').hide();
              }
            );
          }


          function _addHistory() {
            var sql = $carto_editor.getValue();

            if ($carto_editor.historyArray[$carto_editor.historyIndex] != sql) {
              // Size bigger than 10?
              if ($carto_editor.historyArray.length>=10) {
                $carto_editor.historyArray.shift();
              } else {
                $carto_editor.historyIndex++;
                $carto_editor.historyArray = $carto_editor.historyArray.slice(0,$carto_editor.historyIndex);
              }
              $carto_editor.historyArray.push(sql);

              // Check undo and redo activation
              if (($carto_editor.historyIndex + 1) == ($carto_editor.historyArray.length)) {
                $carto.find('a.redo').removeClass('active');
              } else {
                $carto.find('a.redo').addClass('active');
              }

              if ($carto_editor.historyIndex < 0) {
                $carto.find('a.undo').removeClass('active');
              } else {
                $carto.find('a.undo').addClass('active');
              }
            }
          }


          function _activate(ev) {
            if (ev) {
              ev.preventDefault();
            }

            // Remove all selected and say Carto is being used
            $vis_ul.find('li.selected').removeClass('selected special')
            $('div.map_window div.map_header ul li p:eq(1)').text('Carto');

            if (ev)
              _saveProperties();
          }


          function _saveProperties() {
            _addHistory();
            that.saveTilesStyles('/*carto*/' + $carto_editor.getValue());
          }
      }());
    }

    /* Set map styles */
    CartoMap.prototype.setMapStyle = function(geom_type,map_style) {

      /*Map type - header*/
      var map = this.map_
        , me = this;

      var map_customization = (function($, window, undefined){
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

          // Start now wax
          me.startWax();
        } else {
          me.zoomToBBox();
        }

        /* Bind bounds changed on map to cartomap */
        google.maps.event.addListener(me.map_, 'dragend', function(ev) {
          custom_map_properties.latitude = this.getCenter().lat();
          custom_map_properties.longitude = this.getCenter().lng();
          me.saveMapStyle(custom_map_style,custom_map_properties);
        });
        google.maps.event.addListener(me.map_, 'zoom_changed', function(ev) {
          custom_map_properties.zoom = this.getZoom();
          me.saveMapStyle(custom_map_style,custom_map_properties);
        });
  
  
  
        $('.map_header ul.map_type li a.option').live('click',function(ev){
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
              map.setOptions({mapTypeId: google.maps.MapTypeId.HYBRID});
              $('.map_header ul.main li.first p').text('Satellite');
            } else if (map_type=="Terrain") {
              map.setOptions({mapTypeId: google.maps.MapTypeId.TERRAIN});
              $('.map_header ul.main li.first p').text('Terrain');
            } else {
              map.setOptions({mapTypeId: google.maps.MapTypeId.ROADMAP});
              $('.map_header ul.main li.first p').text('Roadmap');
            }
            
            custom_map_style.type = map_type.toLowerCase();
            me.saveMapStyle(custom_map_style,custom_map_properties);
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
            me.saveMapStyle(custom_map_style,custom_map_properties);
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
            me.saveMapStyle(custom_map_style,custom_map_properties);
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
            map.setOptions({mapTypeId: google.maps.MapTypeId.HYBRID});
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
      }(jQuery, window));
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

      
      $('.map_header ul.infowindow_customization div.suboptions span.info_tools a.mark_all,.map_header ul.infowindow_customization div.suboptions span.info_tools a.clear_all').live('click',function(ev){
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

        me.saveInfowindowVars(custom_infowindow);
      });

      
      $('.map_header ul.infowindow_customization div.suboptions ul.column_names li.vars a').live('click',function(ev){
        stopPropagation(ev);
        var value = $(this).text();
        
        if ($(this).hasClass('on')) {
          $(this).removeClass('on');
          custom_infowindow[value] = false;
        } else {
          $(this).addClass('on');
          custom_infowindow[value] = true;
        }
        
        me.saveInfowindowVars(custom_infowindow);
      });
      
    
      $('.map_header ul.infowindow_customization li > a').live('click',function(ev){
        stopPropagation(ev);
        var parent = $(this).parent();
        if (!parent.hasClass('selected') && !parent.hasClass('disabled') && !parent.hasClass('vars')) {
          $('.map_header ul.infowindow_customization li').each(function(i,li){$(li).removeClass('selected special')});
          
          // Add selected to the parent (special?)
          if (parent.find('div.suboptions').length>0) {
            parent.addClass('selected special');
            $('.map_header ul.infowindow_customization').closest('li').find('p').text('Custom');
            me.saveInfowindowVars(custom_infowindow);
          } else {
            $('.map_header ul.infowindow_customization').closest('li').find('p').text('Default');
            parent.addClass('selected');
            me.saveInfowindowVars(default_infowindow);
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
              if (arr[0]!='cartodb_id' && arr[0]!='the_geom' && arr[0]!='the_geom_webmercator') {
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
              if (default_infowindow[name]==undefined) {
                delete infowindow_vars[name];
              } else {
                $('.map_header ul.infowindow_customization div.suboptions ul.column_names').append('<li class="vars"><a class="'+(value?'on':'')+'">'+name+'</a</li>');
              }
            });

            // Initialize jscrollPane
            $('.map_header ul.infowindow_customization div.suboptions ul.scrollPane').jScrollPane({autoReinitialise:true});

            me.infowindow_vars_ = infowindow_vars;
            me.saveInfowindowVars(me.infowindow_vars_);
          },
          error: function(e) {
            console.debug(e);
            $('.map_header ul.infowindow_customization li:eq(1)').addClass('disabled');
          }
        });
      }
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
    CartoMap.prototype.fadeOutWax = function() {}

    /* Full of opacity wax again */
    CartoMap.prototype.fadeInWax = function() {}

    /* Refresh wax tiles */
    CartoMap.prototype.refreshWax = function() {
      // Add again wax layer
      if (this.map_) {

        // update tilejson with cache buster
        this.cache_buster = this.cache_buster + 1;
        this.map_.overlayMapTypes.clear();

        this.tilejson.grids = wax.util.addUrlData(this.tilejson.grids_base,  'cache_buster=' + this.cache_buster);

        // add map tiles
        this.wax_tile = new wax.g.connector(this.tilejson);
        this.map_.overlayMapTypes.insertAt(0,this.wax_tile);

        // add interaction
        if ( this.interaction ) this.interaction.remove();
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
        var query = 'sql=' + editor.getOption('query');
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
              if (me.fakeMarker_) {
                me.fakeMarker_.setMap(null);
                me.fakeMarker_ = null;
                // Refresh tiles
                me.refreshWax();
              }
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

    /* REVIEW - Show Big Bang error window due to edition of huge polygon */
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

      // Close cartocss
      $('.cartocss_editor').hide();
      
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
      this.query_mode = ($('body').hasClass('query'));
      $('body').addClass('map');

      // Update tools if there was any change in the table or table name
      this.updateTools();

      // Check if there was any change in the table to composite 
      //    the infowindow vars customization properly
      this.setupInfowindow();

      // Refresh wax layer
      this.tilejson = this.generateTilejson();
      this.refreshWax();
      

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
      window.ops_queue.responseRequest(this.loaderId,'ok','');
			this.loaderId = null;
    }

    CartoMap.prototype.showLoader = function() {
      var loaderId = createUniqueId(),
					me = this;
					
			if (this.loaderId) {
				window.ops_queue.responseRequest(this.loaderId,'ok','');
			}
					
      this.loaderId = loaderId;
      window.ops_queue.newRequest(loaderId,'tiles_loaded');
			setTimeout(function(){
				me.hideLoader();
			},3000);
    }



    ////////////////////////////////////////
    //  HIDE OR SHOW MAP				          //
    ////////////////////////////////////////
    CartoMap.prototype.hide = function() {
      // Remove all things
			this.hideLoader();

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
			this.showLoader();
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
      window.ops_queue.newRequest(requestId,type);

      $.ajax({
        dataType: 'json',
        type: request_type,
        dataType: "text",
        headers: {"cartodbclient": true},
        url: global_api_url+'tables/'+table_name+url_change,
        data: params,
        success: function(data) {
            window.ops_queue.responseRequest(requestId,'ok','');
            me.successRequest(params,new_value,old_value,type,data);
        },
        error: function(e, textStatus) {
          try {
            var msg = $.parseJSON(e.responseText).errors[0];
            if (msg == "Invalid rows: the_geom") {
              window.ops_queue.responseRequest(requestId,'error','First georeference your table');
            } else {
              window.ops_queue.responseRequest(requestId,'error',msg);
            }
          } catch (e) {
            window.ops_queue.responseRequest(requestId,'error','There has been an error, try again later...');
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
      var me = this;

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
        case "update_geometry": me.refreshWax();
                                me.removeFakeGeometries();
                                break;
        default:                break;
      }
    }
