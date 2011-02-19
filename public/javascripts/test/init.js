  var map;
  var bounds = new google.maps.LatLngBounds();
  var globalIndex = 0;

  jQuery(function($) {
      showLoader();
          
      var myOptions = {
        zoom: 6,
        center: new google.maps.LatLng(40.4166909, -3.7003454),
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
      map = new google.maps.Map(document.getElementById("map"),myOptions);
          
          
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


    
      var places = [
        "Calle Hortaleza 48, Madrid",
        "Calle Jacobinia 38, Madrid",
        "Calle Angosta de los Mancebos 2, Madrid",
        "Puerta del Sol, Madrid",
        "Vía Lusitana, Madrid",
        "La Navata, Madrid",
        "Móstoles, Madrid"
      ]
    
      //  Worker job
      
      var worker = new Worker("/javascripts/test/worker.js");
      
      worker.onmessage = function(event){
        if (event.data == "Finish") {
          hideLoader();
          setTimeout(function(){map.fitBounds(bounds)},500);
        } else {
          var latlng = new google.maps.LatLng(event.data.Placemark[0].Point.coordinates[1],event.data.Placemark[0].Point.coordinates[0]);          
          var marker = new google.maps.Marker({position: latlng, map: map,title:"Your position!"});
          bounds.extend(latlng);
        }
      };

      worker.postMessage(places);
  });



  function showLoader() {
    $('p.loading').fadeIn();
  }


  function hideLoader() {
    $('p.loading').fadeOut();
  }
  
  