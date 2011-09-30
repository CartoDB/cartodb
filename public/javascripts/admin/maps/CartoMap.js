
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
      
      // BBox in the map
      this.zoomToBBox();
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
              me.selection_area_    = new google.maps.Polygon({strokeWeight:1});                            // Selection polygon area
              me.info_window_       = new CartoInfowindow(new google.maps.LatLng(-260,-260),me.map_);       // InfoWindow for markers
              me.tooltip_           = new CartoTooltip(new google.maps.LatLng(-260,-260),me.map_);		    // Over tooltip for markers and selection area
              me.delete_window_     = new CartoDeleteWindow(new google.maps.LatLng(-260,-260), me.map_);    // Delete window to confirm remove one/several markers
              me.map_canvas_ 	    = new mapCanvasStub(me.map_);                                           // Canvas to control the coordinates
          }
      );
    }



    ////////////////////////////////////////
    //  GET / SET MAP STYLES    		      //
    ////////////////////////////////////////
    CartoMap.prototype.getStyles = function() {
      var me = this,
          map_style,
          layers_style,
          geom_type,
          count = 0;
      
      
      // When all need variables arrived
  		$(document).bind('arrived',function(){
			  count++;
			  if (count==3) {
  			  $(document).unbind('arrived');
  			  me.setTools(geom_type,layers_style,map_style);
			  }
			});
      
      
      // Get map style
      // TODO map style
      // Manage errors if they happen
      map_style = [ { stylers: [ { saturation: -65 }, { gamma: 1.52 } ] },{ featureType: "administrative", stylers: [ { saturation: -95 }, { gamma: 2.26 } ] },{ featureType: "water", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "administrative.locality", stylers: [ { visibility: "off" } ] },{ featureType: "road", stylers: [ { visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 } ] },{ featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "road.arterial", stylers: [ { visibility: "off" } ] },{ featureType: "road.local", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "transit", stylers: [ { visibility: "off" } ] },{ featureType: "road", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "poi", stylers: [ { saturation: -55 } ] } ];
      $(document).trigger('arrived');



      // Get geom type
      $.ajax({
          method: "GET",
          url: global_api_url+'queries?sql='+escape('SELECT type from geometry_columns where f_table_name = \''+table_name+'\' and f_geometry_column = \'the_geom\''),
          headers: {"cartodbclient":"true"},
          success: function(data) {
            if (data.rows.length>0) {
              geom_type = me.geometry_type_ = data.rows[0].type.toLowerCase();
            } else {
              geom_type = undefined;
            }
            $(document).trigger('arrived');
          },
          error: function(e) {
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
          $(document).trigger('arrived');
        },
        error:function(e) {
          console.debug(e);
        } 
      });
    }
    
    CartoMap.prototype.setStyles = function(obj) {
        // var me = this;
        // 
        // // TODO -> generate the cartocss json
        // 
        // $.ajax({
        //     url:TILEHTTP + '://' + user_name + '.' + TILESERVER + '/tiles/' + table_name + '/style',
        //     type: 'POST',
        //     success: function(result) {
        //         // Refresh Wax with the new styles
        //         me.refreshWax();
        //     },
        //     error:function(e) {}
        // });
    }



    ////////////////////////////////////////
    //  MAP AND TOOLS         			      //
    ////////////////////////////////////////
    /* Event listeners of the map */
    CartoMap.prototype.addMapListeners = function() {
      var me = this;

      google.maps.event.addListener(this.map_, 'zoom_changed', function() {
          $('span.slider').slider('value',me.map_.getZoom());
      });

      google.maps.event.addListener(this.map_, 'click', function(ev) {
          if (me.status_=="add_point") {
              me.addMarker(ev.latLng, {lat_:ev.latLng.lat(), lon_:ev.latLng.lng()}, true);
          }
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
          			    console.log('map');
          stopPropagation(ev);
          me.query_mode = false;
          me.refresh();
        }
      });

      // Try query
      $('div.sql_window a.try_query').livequery('click',function(ev){
        var map_status = ($('body').attr('view_mode') == "map");
        if (map_status) {
          stopPropagation(ev);
          $('body').attr('query_mode','true');
          me.query_mode = true;
          setAppStatus();
          me.refresh();
          
          var requestId = createUniqueId();
          requests_queue.newRequest(requestId,'query_table');

          // Get results from api
          $.ajax({
            method: "GET",
            url: global_api_url+'queries?sql='+escape(editor.getValue().replace('/\n/g'," ")),
            headers: {"cartodbclient":"true"},
            success: function(data) {
  			      // Remove error content
  						$('div.sql_window span.errors').hide();
  						$('div.sql_window div.inner div.outer_textarea').css({bottom:'50px'});
  						$('div.sql_window').css({'min-height':'199px'});
  						
  						$('span.query h3').html(data.total_rows + ' row' + ((data.total_rows>1)?'s':'') + ' matching your query <a class="clear_table" href="#clear">CLEAR VIEW</a>');
  						$('span.query p').text('This query took '+data.time.toFixed(3)+' seconds');
  						
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
  			      
  			      $('span.query h3').html('No results for this query <a class="clear_table" href="#clear">CLEAR VIEW</a>');
      				$('span.query p').text('');
  			    }
          });
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
              
              bounds.extend(new google.maps.LatLng(coor1[1],coor1[0]));
              bounds.extend(new google.maps.LatLng(coor2[1],coor2[0]));
                              
              me.map_.fitBounds(bounds);
              
              if (map.getZoom()<2) {
                map.setZoom(2);
              }
            }

          },
          error: function(e) {
          }
      });
    }

    /* Set the tools due to geom_type... */
    CartoMap.prototype.setTools = function(geom_type,layers_style,map_style) {
      var me = this;
      var map = me.map_;
      
      /*Geometry tools*/
      if (geom_type=="point" || geom_type=="multipoint") {
          $('div.general_options ul li.map a.add_point').parent().removeClass('disabled');
          $('div.map_window div.map_header ul li p:eq(1)').text('Point visualization');
      } else if (geom_type=="polygon" || geom_type=="multipolygon") {
          $('div.general_options ul li.map a.add_polygon').parent().removeClass('disabled');
          $('div.map_window div.map_header ul li p:eq(1)').text('Polygon visualization');
      } else {
          $('div.general_options ul li.map a.add_polyline').parent().removeClass('disabled');
          $('div.map_window div.map_header ul li p:eq(1)').text('Line visualization');
      }
      
      
      
      /*Map type - header*/
      var map_customization = (function(){
        //me.map_style = map_style;
        map.setOptions({styles:map_style});
  
        // Get saturation, labels on/off, roads on/off
  
        $('.map_header ul.map_type li a').livequery('click',function(ev){
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
                     
            // TODOOOOO Save the value in the server!!!!!
            
            // Do action
            if (map_type=="Roadmap") {
              map.setOptions({mapTypeId: google.maps.MapTypeId.ROADMAP});
            } else if (map_type=="Satellite") {
              map.setOptions({mapTypeId: google.maps.MapTypeId.SATELLITE});
            } else {
              map.setOptions({mapTypeId: google.maps.MapTypeId.TERRAIN});
            }
          }
        });
        
        return {}
  		}());
      
      
      /*Geometry customization - header*/
      var geometry_customization = (function(){
        
        $('.map_header ul.geometry_customization li a').livequery('click',function(ev){
          stopPropagation(ev);
          var parent = $(this).parent();
          if (!parent.hasClass('selected') && !parent.hasClass('disabled')) {
          }
        });
        
        
        // Remove the customization that doesn't belong to the geom_type
        if (geom_type == 'multipoint') {
          $('.map_header ul.geometry_customization li a:contains("polygons")').parent().remove();
          $('.map_header ul.geometry_customization li a:contains("lines")').parent().remove();
        } else if (geom_type == 'multipolygon') {
          $('.map_header ul.geometry_customization li a:contains("points")').parent().remove();
          $('.map_header ul.geometry_customization li a:contains("lines")').parent().remove();
        } else {
          $('.map_header ul.geometry_customization li a:contains("polygons")').parent().remove();
          $('.map_header ul.geometry_customization li a:contains("points")').parent().remove();
        }

        return {}
  		}());
      
      
      /*Infowindow customization - header*/
      var infowindow_customization = (function(){
         $('.map_header ul.infowindow_customization li a').livequery('click',function(ev){
           stopPropagation(ev);
           var parent = $(this).parent();
           if (!parent.hasClass('selected') && !parent.hasClass('disabled')) {

           }
         });

        return {}
  		}());

 
      /* Bind event for open any tool */
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
              me.bindMapESC();
            };
          });
          options.show();
        } else {
         me.unbindMapESC();
         $('body').unbind('click');

         options.hide();
        }
      });


      // All loaded? Ok -> Let's show options...
      if (geom_type!=undefined) {
        $('.map_header a.open').fadeIn();
      }
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

    

    ////////////////////////////////////////
    //  WAX AND TOOLS LISTENERS			      //
    ////////////////////////////////////////
    CartoMap.prototype.startWax = function() {
      // interaction placeholder
      var me = this;
      var currentCartoDbId;
      this.tilejson = this.generateTilejson();
            
      this.waxOptions = {
          callbacks: {
              out: function(){
                  me.over_marker_ = false;
                  me.map_.setOptions({ draggableCursor: 'default' });
              },
              over: function(feature, div, opt3, evt){
                  if (me.status_ == "select" && !me.query_mode) {
                      me.over_marker_ = true;
                      me.map_.setOptions({ draggableCursor: 'pointer' });
                      me.tooltip_.open(evt.latLng,feature);
                  }
              },
              click: function(feature, div, opt3, evt){

                  // click, load information - show geometry - hide layers
                  // Get results from api
                  if (me.status_ == "select" && !me.query_mode) {
                      $.ajax({
                          method: "GET",
                          url: global_api_url+'queries?sql='+escape('SELECT ST_GeometryType(the_geom) FROM '+table_name+' WHERE cartodb_id = ' + feature),
                          headers: {"cartodbclient":"true"},
                          success: function(data) {
                              var type = (data.rows[0].st_geometrytype).toLowerCase();
                              me.info_window_.openWax(feature);
                          },
                          error: function(e) {
                          }
                      });

                      me.hideOverlays();
                  }

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
        var base_url = TILEHTTP + '://' + user_name + '.' + TILESERVER + '/tiles/' + table_name + '/{z}/{x}/{y}';
        var tile_url = base_url + '.png8?cache_buster={cache}';  //gotta do cache bust in wax for this
        var grid_url = base_url + '.grid.json';

        // Add map keys to base urls
        tile_url = wax.util.addUrlData(tile_url, 'map_key=' + map_key);
        grid_url = wax.util.addUrlData(grid_url, 'map_key=' + map_key);

        // SQL?
        if (this.query_mode) {
            var query = 'sql=' + editor.getValue();
            tile_url = wax.util.addUrlData(tile_url, query);
            grid_url = wax.util.addUrlData(grid_url, query);
        }

        // Build up the tileJSON
        return {
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
        if (me.fakeGeometries_.length>0) {
          me.updateGeometry(me.fakeGeometries_,me.geometry_type_,me.fakeGeometries_[0].data);
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
                      me.info_window_.open(this);
                  }
              });


              // Click on map to recover wax layer and remove marker
              google.maps.event.addListener(map,'click',function(ev){
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

      $.ajax({
        method: "GET",
        url:global_api_url + 'tables/'+table_name+'/records/'+feature,
        headers: {"cartodbclient": true},
        success:function(data){
          me.removeWax();

          // Get polygons coordinates
          var poly_obj = transformGeoJSON(data.the_geom);
          
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
    
    /* Add fake google polylines to the map */
    CartoMap.prototype.addFakePolylines = function(feature) {     
      var me = this;
      this.fakeGeometries_ = new Array();

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
      
      //strokeColor:"#FF6600",strokeOpacity:1.0,strokeWeight:2,map:this.map,clickable:true
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
    }
    
  	// Close all map elements
    CartoMap.prototype.closeMapWindows = function() {
      $('.map_header div.options').hide();
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
    //  HIDE OR SHOW MAP				  //
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
