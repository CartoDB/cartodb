  
  function Geocoding(column,table) {
    this.column = column;
    geolocating = true;
    this.table = table;
    this.startGeocoding();
    
    this.requestId = createUniqueId();
  }
  
  
  /*============================================================================*/
	/* Start worker geocoding	*/
	/*============================================================================*/
	Geocoding.prototype.startGeocoding = function() {
	  var me = this;
		$.ajax({
      method: "GET",
      url: '/v1/tables/'+table_name+'/records/pending_addresses',
      success: function(data) {
        console.log(data);
                // 
                // var rows = data.rows;
                // var directions = [];
                // for (var i=0; i<rows.length; i++) {
                //   var elem = {};
                //   elem.address = rows[i].address;
                //   elem.cartodb_id = rows[i].cartodb_id;
                //   directions.push(elem);
                // }
                // 
                // var worker = new Worker("/javascripts/admin/table/worker_geocoding.js");
                // 
                // worker.onmessage = function(event){
                //   if (event.data == "Finish" || event.data == "Stopped") {
                //     if (event.data == "Finish") {
                //       me.finishGeocoding();
                //       delete worker;
                //     } else {
                //       me.stoppedGeocoding();
                //       delete worker;
                //     }
                //   } else {
                //     var params = {};
                //     if (event.data.Placemark!=undefined) {
                //       params['lat'] = event.data.Placemark[0].Point.coordinates[1];
                //       params['lon'] = event.data.Placemark[0].Point.coordinates[0];
                //     } else {
                //       params['lat'] = -0;
                //       params['lon'] = -0;
                //     }
                // 
                //     $.ajax({
                //       type: "PUT",
                //       url: '/api/json/tables/'+me.table+'/update_geometry/'+event.data.cartodb_id,
                //       data: params,
                //       success: function(data) {
                //         //console.log(data);
                //       },
                //       error: function(e) {
                //         //console.log(e);
                //       }
                //     });
                //   }
                // };
   
        // worker.postMessage({process: 'start', places: directions});
        // $(window).bind('stopGeo',function(ev){
        //   worker.postMessage({process: 'stop', places: null});
        // });
       }
    });
	}
	
	
  /*============================================================================*/
	/* Finish geocoding	*/
	/*============================================================================*/
	Geocoding.prototype.finishGeocoding = function() {
	  $('p.geo').removeClass('loading');
		geolocating = false;
	}
	
	
	/*============================================================================*/
	/* Stop geocoding	*/
	/*============================================================================*/
	Geocoding.prototype.stoppedGeocoding = function() {
	  requests_queue.responseRequest(this.requestId,'error','You have stopped the geocoding...');
		geolocating = false;
	}
	
	
	
  