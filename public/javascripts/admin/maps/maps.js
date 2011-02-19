
  var map = null;
  var markers = [];
  var bounds;
  
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
    var api_key = ""; // API key is not necessary if you are at localhost:3000 and you are logged in in CartoDB
    var query = "select cartodb_id," + 
                "ST_X(the_geom) as lon, ST_Y(the_geom) as lat " + 
                "from " + $('h2 a').text();
    $.ajax({
      url: "/api/json/tables/query",
      data: ({api_key: api_key, query: query}),
      dataType: "jsonp",
      success: function( data ) {
        
        bounds = new google.maps.LatLngBounds();
        
        if(data != null) {
          for(var i=0;i<data.rows.length;i++){
            var row = data.rows[i];
            var marker = new google.maps.Marker({position: new google.maps.LatLng(row.lat, row.lon), map: map,title:"Your position!"});
            markers.push(marker);         
            bounds.extend(new google.maps.LatLng(row.lat, row.lon));
          }
          map.fitBounds(bounds);
        }
      },
      error: function(req, textStatus, e) {
        console.log(textStatus);
      }
    });
  }
  
  
  function showMapLoader() {
    
  }
  
  
  function hideMapLoader() {
    
  }
  
  
  function clearMap() {
    for(var i=0; i < markers.length; i++){
        markers[i].setMap(null);
    }
    markers = new Array();
  }