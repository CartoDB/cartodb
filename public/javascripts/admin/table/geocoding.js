  
  function Geocoding(column,table) {
    this.column = column;
    geolocating = true;
    this.table = table;
    this.startGeocoding();
    
    this.requestId = createUniqueId();
    requests_queue.newRequest(this.requestId,"georeference_address");
  }
  
  
  /*============================================================================*/
	/* 	*/
	/*============================================================================*/
	Geocoding.prototype.startGeocoding = function() {
	  var me = this;
		$.ajax({
      method: "GET",
      url: '/api/json/tables/'+this.table,
      data: {rows_per_page: 200, page: 0},
      success: function(data) {
        var rows = data.rows;
        var directions = [];
        for (var i=0; i<rows.length; i++) {
          var elem = {};
          elem.address = rows[i].address;
          elem.cartodb_id = rows[i].cartodb_id;
          directions.push(elem);
        }
        
        var worker = new Worker("/javascripts/admin/table/worker_geocoding.js");

        worker.onmessage = function(event){
          if (event.data == "Finish") {
            me.finishGeocoding();
            delete worker;
          } else {
            var params = {};
            params['lat'] = event.data.Placemark[0].Point.coordinates[1];
            params['lon'] = event.data.Placemark[0].Point.coordinates[0];
            
            $.ajax({
              type: "PUT",
              url: '/api/json/tables/'+me.table+'/update_geometry/'+event.data.cartodb_id,
              data: params,
              success: function(data) {
                console.log(data);
              },
              error: function(e) {
                console.log(e);
              }
            });
            
            //var latlng = new google.maps.LatLng(event.data.Placemark[0].Point.coordinates[1],event.data.Placemark[0].Point.coordinates[0]);          
            // var marker = new google.maps.Marker({position: latlng, map: map,title:"Your position!"});
            // bounds.extend(latlng);
            //console.log(latlng);
          }
        };

        worker.postMessage(directions);
       }
    });
	}
	
	
  /*============================================================================*/
	/* 	*/
	/*============================================================================*/
	Geocoding.prototype.finishGeocoding = function() {
	  requests_queue.responseRequest(this.requestId,'ok','');
		geolocating = false;
	}
	
	
	
  