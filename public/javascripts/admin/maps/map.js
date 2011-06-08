
  var map;
  var vector_markers = {};

  function initMap() {
    createHeaderElements();  
    createMapElements();  
  }



  function showMap() {
    $('div.map_window div.map_curtain').hide();
    $('p.georeferencing').hide();
      
    if (map==null) {
      var myOptions = {
        zoom: 2,
        center: new google.maps.LatLng(29.075,-1.3183),
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
      map = new google.maps.Map(document.getElementById("map"),myOptions);
      google.maps.event.addListener(map, 'dblclick', function() {
        $('span.slider').slider('value',map.getZoom());
      });
    }
    
    
  }


  function hideMap() {
    $('div.map_window div.map_curtain').show();
  }
  

  
  

