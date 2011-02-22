
  var map = null;
  var markers = [];
  var bounds;
  var geocoder = new google.maps.Geocoder();

  $(document).ready(function(){
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
      url: "/api/json/tables/query",
      data: ({api_key: api_key, query: query}),
      dataType: "jsonp",
      success: function( data ) {
        bounds = new google.maps.LatLngBounds();
        var image = new google.maps.MarkerImage('/images/admin/map/marker.png',new google.maps.Size(33, 33),new google.maps.Point(0,0),new google.maps.Point(12, 33));
        
        if(data != null) {
          markers = [];
          for(var i=0;i<data.rows.length;i++){
            var row = data.rows[i];
            var marker = new google.maps.Marker({position: new google.maps.LatLng(row.lat, row.lon), icon: image, map: map, draggable:true, raiseOnDrag:true, data:row});
            google.maps.event.addListener(marker,"dragstart",function(ev){
              marker.data.init_latlng = ev.latLng;
    				});
            google.maps.event.addListener(marker,"dragend",function(ev){
    					onMoveOccurrence(ev,marker.data);
    				});
            markers[row.cartodb_id] = marker;         
            bounds.extend(new google.maps.LatLng(row.lat, row.lon));
          }
          
          if (data.rows.length<2) {
            map.setCenter(bounds.getCenter());
            map.setZoom(9);
          } else {
            map.fitBounds(bounds);
          }
        }
        hideLoader();
      },
      error: function(req, textStatus, e) {
        console.log(textStatus);
        hideLoader();
      }
    });
  }
  
  
  function onMoveOccurrence(event,occu_data) {
    var requestId = createUniqueId();
    requests_queue.newRequest(requestId,'change_latlng');
    
    geocoder.geocode({'latLng': event.latLng}, function(results, status) {
      
      var params = {};
      params.lat = '';
      params.lon = '';
      params.address = '';
      
      if (status == google.maps.GeocoderStatus.OK) {
        params.address = results[0].formatted_address;
      }
      
      $.ajax({
        dataType: 'json',
        type: 'PUT',
        url: '/api/json/tables/'+table_id+'/update_geometry',
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
    }
    markers = new Array();
  }