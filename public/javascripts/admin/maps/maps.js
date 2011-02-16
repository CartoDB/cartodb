
  var map = null;
  
  $(document).ready(function(){
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
        zoom: 4,
        center: new google.maps.LatLng(-33, 151),
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.TERRAIN
      }
      map = new google.maps.Map(document.getElementById("map"),myOptions);
    }
    getMapTableData()
  }
  
  function hideMap() {
    $('div.map_window div.map_curtain').show();
  }
  
  
  function getMapTableData() {
    
  }
  
  
  function showMapLoader() {
    
  }
  
  
  function hideMapLoader() {
    
  }