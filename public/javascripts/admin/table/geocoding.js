  
  function Geocoding(column,table) {
    this.column = column;
    geolocating = true;
    this.table = table;
    this.startGeocoding();
  }
  
  
  /*============================================================================*/
	/* Start worker geocoding	*/
	/*============================================================================*/
	Geocoding.prototype.startGeocoding = function() {
	  var me = this;
		$.ajax({
      method: "GET",
      url: '/v1/tables/'+table_name+'/records/pending_addresses',
      headers: {'cartodbclient':true},
      data: {rows_per_page:5000},
      success: function(data) {
        var rows = data;
        var directions = [];
        for (var i=0; i<rows.length; i++) {
          var elem = {};
          $.each(rows[i],function(i,ele){
            if (i=="cartodb_id") {
              elem.cartodb_id = ele;
            } else {
              elem.address = ele;
            }
            directions.push(elem);
          });
        }
        me.processGeocoding(directions);
       }
    });
	}
	
	
	/*============================================================================*/
	/* Process geocoding	*/
	/*============================================================================*/
	Geocoding.prototype.processGeocoding = function(directions) {
    var me = this;
    var worker = new Worker("/javascripts/admin/table/worker_geocoding.js");

    worker.onmessage = function(event){
      console.log(event.data);
      if (event.data == "Finish" || event.data == "Stopped") {
        if (event.data == "Finish") {
          me.finishGeocoding();
          delete worker;
        } else {
          me.stoppedGeocoding();
          delete worker;
        }
      } else {
        var params = {};
        if (event.data.Placemark != undefined) {
          params['the_geom'] = {"type":"Point","coordinates":[event.data.Placemark[0].Point.coordinates[0],event.data.Placemark[0].Point.coordinates[1]]};
        } else {
          params['address_geolocated'] = false;
        }
                  
        $.ajax({
          type: "PUT",
          url: '/v1/tables/'+table_name+'/records/'+event.data.cartodb_id,
          headers: {'cartodbclient':true},
          data: params,
          dataType: 'text',
          success: function(data) {
          },
          error: function(e) {
            console.debug(e);
          }
        });
      }
    };

    worker.postMessage({process: 'start', places: directions});
    $(window).bind('stopGeo',function(ev){
      worker.postMessage({process: 'stop', places: null});
    });
	}
	
	
	
	
  /*============================================================================*/
	/* Finish geocoding	*/
	/*============================================================================*/
	Geocoding.prototype.finishGeocoding = function() {
	  
	  var me = this;
		$.ajax({
      method: "GET",
      url: '/v1/tables/'+table_name+'/records/pending_addresses',
      headers: {'cartodbclient':true},
      success: function(data) {
        if (data.length==0) {
          $('p.geo').removeClass('loading');
      		geolocating = false;
        } else {
          var rows = data;
          var directions = [];
          for (var i=0; i<rows.length; i++) {
            var elem = {};
            $.each(rows[i],function(i,ele){
              if (i=="cartodb_id") {
                elem.cartodb_id = ele;
              } else {
                elem.address = ele;
              }
              directions.push(elem);
            });
          }
          me.processGeocoding(directions);
        }
       }
    });
	}
	



	/*============================================================================*/
	/* Stop geocoding	*/
	/*============================================================================*/
	Geocoding.prototype.stoppedGeocoding = function() {
	  $('p.geo').removeClass('loading');
		geolocating = false;
	}
	
	
	
  