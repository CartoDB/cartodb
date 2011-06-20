
  var map;
  var vector_markers = {};
	var bounds;
	var map_status = 'select';


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
			
			google.maps.event.addListener(map, 'click', function(ev) {
				if (map_status=="add")
					addNewOcc(ev.latLng);
			});
    }
		
		head.js("/javascripts/admin/maps/mapCanvasStub.js",
			"/javascripts/admin/maps/CartoTooltip.js",
			"/javascripts/admin/maps/CartoInfowindow.js",function(){
			
			// Reset map to defaults
			resetMapDefaults(); 
			
			// Start map
			startMap();
			
			var tooltip = new CartoTooltip(new google.maps.LatLng(43,-3),1,map);
			var infowindow = new CartoInfowindow(new google.maps.LatLng(43,-3),1,null,map);
		});
  }


  function hideMap() {
    $('div.map_window div.map_curtain').show();
  }


	function resetMapDefaults() {
		map_status = "select";
		$('div#map_tools').find('li').removeClass('selected');
		$('div#map_tools li').first().addClass('selected');
	}
  

  
  

