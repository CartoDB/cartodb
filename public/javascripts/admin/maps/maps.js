
  var map = null;
  var markers = [];
  var bounds;
  var geocoder;
  var image;
  

  head(function(){
    
    geocoder = new google.maps.Geocoder();
    image = new google.maps.MarkerImage('/images/admin/map/marker.png',new google.maps.Size(33, 33),new google.maps.Point(0,0),new google.maps.Point(12, 33));
    
    
    ///////////////////////////////////////
    //  Map elements                     //
    ///////////////////////////////////////
    $('div.map_window').append(
      '<div class="map_curtain"></div>'+
      '<a href="#zoom_in" class="zoom_in"></a>'+
      '<a href="#zoom_out" class="zoom_out"></a>'+
      '<p class="loading">Loading</p>'+
      '<div class="map_header">'+
        '<ul>'+
          '<li class="first">'+
            '<h4><a href="#">Map type</a></h4>'+
            '<p>Terrain</p>'+
            '<a class="open" href="#open_map_type">open</a>'+
            '<span class="map_type_list">'+
              '<ul>'+
                '<li><a map="hybrid" href="#hybrid">Hybrid</a></li>'+
                '<li><a map="roadmap" href="#roadmap">Roadmap</a></li>'+
                '<li><a map="satellite" href="#satellite">Satellite</a></li>'+
                '<li><a map="terrain" href="#terrain">Terrain</a></li>'+
              '</ul>'+
            '</span>'+
          '</li>'+
          '<li>'+
            '<h4>Visualization type</h4>'+
            '<p>Features visualization</p>'+
          '</li>'+
          '<li>'+
            '<h4>Markers customization</h4>'+
            '<p>Customized dots</p>'+
          '</li>'+
          '<li>'+
            '<h4>Infowindow customization</h4>'+
            '<p>Default</p>'+
          '</li>'+
        '</ul>'+
      '</div>'+
      '<div id="map"></div>'
    );
    
    
    
    
    //Zooms
    $('a.zoom_in').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      map.setZoom(map.getZoom()+1);
    });
    $('a.zoom_out').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      map.setZoom(map.getZoom()-1);
    });

    
    ///////////////////////////////////////
    //  Change map type                  //
    ///////////////////////////////////////
    $('div.map_header ul:eq(0) li').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      $(this).children('span').toggle();
      $('body').click(function(event) {
        if (!$(event.target).closest('span.map_type_list').length) {
          $('span.map_type_list').toggle();
          $('body').unbind('click');
        };
      });
    });
    $('div.map_header ul:eq(1) li a').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      switch ($(this).attr('map')) {
        case 'hybrid': map.setMapTypeId(google.maps.MapTypeId.HYBRID); $('div.map_header ul:eq(0) li:eq(0) p').text('hybrid'); break;
        case 'satellite': map.setMapTypeId(google.maps.MapTypeId.SATELLITE); $('div.map_header ul:eq(0) li:eq(0) p').text('satellite'); break;
        case 'terrain': map.setMapTypeId(google.maps.MapTypeId.TERRAIN); $('div.map_header ul:eq(0) li:eq(0) p').text('terrain'); break;
        default: map.setMapTypeId(google.maps.MapTypeId.ROADMAP); $('div.map_header ul:eq(0) li:eq(0) p').text('roadmap');
      }
      $('body').unbind('click');
      $(this).closest('span').toggle();
    });
  });



  function showMap() {
    $('div.map_window div.map_curtain').hide();
    if (map==null) {
      var myOptions = {
        zoom: 3,
        center: new google.maps.LatLng(43.444466828054885, 1.673828125000023),
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.TERRAIN
      }
      map = new google.maps.Map(document.getElementById("map"),myOptions);
    }
    getMapTableData();
  }


  function hideMap() {
    $('div.map_window div.map_curtain').show();
    clearMap();
  }


  function getMapTableData() {
    showLoader();
    var api_key = ""; // API key is not necessary if you are at localhost:3000 and you are logged in in CartoDB
    var query = "select cartodb_id," +
                "ST_X(ST_Transform(the_geom, 4326)) as lon, ST_Y(ST_Transform(the_geom, 4326)) as lat " +
                "from " + $('h2 a').text();
    $.ajax({
      method: 'GET',
      url: "/api/json/tables/query",
      data: ({api_key: api_key, query: query}),
      success: function(result) {
        bounds = new google.maps.LatLngBounds();
        
        if(result != null) {
          $.each(result.rows,function(index,row) {
            if (row.lat != null || row.lon != null) {
              var marker = new google.maps.Marker({position: new google.maps.LatLng(row.lat, row.lon), icon: image, map: map, draggable:true, raiseOnDrag:true, data:row});
              markers[row.cartodb_id] = marker;
              bounds.extend(new google.maps.LatLng(row.lat, row.lon));
              
              new google.maps.event.addListener(marker,"dragstart",function(ev){
                this.data.init_latlng = ev.latLng;
      				});
              new google.maps.event.addListener(marker,"dragend",function(ev){
      					onMoveOccurrence(ev,this.data);
      				});     
            }
          })

          if (result.rows.length==1) {
            map.setCenter(bounds.getCenter());
            map.setZoom(9);
          } else{
             if (bounds.getCenter().lat()==0 && bounds.getCenter().lng()==-180) {
              map.setZoom(4);
             } else {
               map.fitBounds(bounds);
             }
          }
        }
        hideLoader();
      },
      error: function(req, textStatus, e) {
        hideLoader();
      }
    });
  }
  
  
  function onMoveOccurrence(event,occu_data) {
    var requestId = createUniqueId();
    requests_queue.newRequest(requestId,'change_latlng');
    
    geocoder.geocode({'latLng': event.latLng}, function(results, status) {
      
      var params = {};
      params.lat = event.latLng.lat();
      params.lon = event.latLng.lng();
      params.address = '';
      
      if (status == google.maps.GeocoderStatus.OK) {
        params.address = results[0].formatted_address;
      }
      
      $.ajax({
        dataType: 'json',
        type: 'PUT',
        url: '/api/json/tables/'+table_id+'/update_geometry/'+occu_data.cartodb_id,
        data: params,
        success: function(data) {
          requests_queue.responseRequest(requestId,'ok','');
        },
        error: function(e, textStatus) {
          try {
            requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors[0]);
          } catch (e) {
            requests_queue.responseRequest(requestId,'error','Seems like you don\'t have Internet connection');
          }
          markers[occu_data.cartodb_id].setPosition(markers[occu_data.cartodb_id].data.init_latlng);
        }
      });
      
    });
  }


  function showLoader() {
    $('p.loading').fadeIn();
  }


  function hideLoader() {
    $('p.loading').fadeOut();
  }


  function clearMap() {
    for(var marker in markers){
      markers[marker].setMap(null);
      google.maps.event.clearListeners(markers[marker],'dragend');
      google.maps.event.clearListeners(markers[marker],'dragstart');
      delete markers[marker];
    }
    markers = [];
  }