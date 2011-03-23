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
      ];
      
      // var xhr = new XMLHttpRequest();
      // xhr.onreadystatechange = function(event){
      //   console.log(event);
      // };
      // xhr.open('GET', 'http://maps.google.com/maps/geo?q=La+Navata,+Madrid&sensor=false&output=xml&callback=onResultGeocode&key=ABQIAAAAsIunaSEq-72JsQD5i92_2RR_u7eJr86POocizq-6e8YHXi9UChSNdQHSPY7oPxUcuoQKcFJS8N7GZQ', true);
      // xhr.send();
    
      
      // var url = "http://maps.google.com/maps/geo?q=La+Navata,+Madrid&sensor=false&output=json&callback=onResultGeocode&key=ABQIAAAAsIunaSEq-72JsQD5i92_2RR_u7eJr86POocizq-6e8YHXi9UChSNdQHSPY7oPxUcuoQKcFJS8N7GZQ"
      // if(XMLHttpRequest)
      // {
      //   var request = new XMLHttpRequest();
      //   if("withCredentials" in request)
      //   {
      //    // Firefox 3.5 and Safari 4
      //    request.open('GET', url, true);
      //    request.onreadystatechange = function(ev){
      //      console.log(ev);
      //    };
      //    request.send();
      //   }
      //   else if (XDomainRequest)
      //   {
      //    // IE8
      //    var xdr = new XDomainRequest();
      //    xdr.open("get", url);
      //    xdr.send();
      // 
      //    // handle XDR responses -- not shown here :-)
      //   }
      // 
      //  // This version of XHR does not support CORS  
      //  // Handle accordingly
      // }
    
      //  Worker job
      
      
      // $.ajax({
      //   url: "http://maps.google.com/maps/geo?q=Paseo+de+la+Castellana+Madrid&sensor=false&output=json&callback=onResultGeocode&key=ABQIAAAAsIunaSEq-72JsQD5i92_2RTAww3tj2XsqHmPq-8d7XPH5-u3QhSVAtLDoI-fQ-ATrYxgBOr2ZpDRhQ",
      //   dataType: 'jsonp',
      //   success: function(result) {
      //     console.log(result);
      //   }
      // });
      
      alert(window.location.host);
      
      var worker = new Worker("/javascripts/test/worker.js");
      
      worker.onmessage = function(event){
        console.log(event.data);
        if (event.data == "Finish") {
          hideLoader();
          setTimeout(function(){map.fitBounds(bounds)},500);
        } else {
          var latlng = new google.maps.LatLng(event.data.Placemark[0].Point.coordinates[1],event.data.Placemark[0].Point.coordinates[0]);          
          var marker = new google.maps.Marker({position: latlng, map: map,title:"Your position!"});
          bounds.extend(latlng);
        }
      };
      
      worker.postMessage({jamon:"jamon"});
  });



  function showLoader() {
    $('p.loading').fadeIn();
  }


  function hideLoader() {
    $('p.loading').fadeOut();
  }
  
  