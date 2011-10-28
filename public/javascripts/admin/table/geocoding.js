  
  function Geocoding(column,table) {
    if (!georeferencing) {
      this.column = column;
      this.table = table_name;
      this.getRecords();
      this.page = 0;

      // Request
      this.requestId = createUniqueId();
      requests_queue.startGeoreferencing(this.requestId);
      // End request
      
      // Georeferencing state -> true
      georeferencing = true;
      $('p.geo').addClass('loading');
    }
  }
  
  
  /*============================================================================*/
	/* Start worker geocoding	*/
	/*============================================================================*/
	Geocoding.prototype.getRecords = function() {
	  var me = this;
		$.ajax({
      method: "GET",
      url: global_api_url+'queries?sql='+escape("SELECT cartodb_id,"+this.column+" as address from "+this.table+" where the_geom is null"),
      headers: {'cartodbclient':true},
      dataType:'jsonp',
      data: {rows_per_page:100,page:me.page},
      success: function(result) {
        var rows = result.rows;
        if (result.rows!=null) {
          // Update loader
          requests_queue.updateGeoreferencing(result.total_rows);
          me.processGeocoding(result.rows);
        } else {
          requests_queue.finishGeoreferencing(me.requestId);
          $('p.geo').removeClass('loading');
      		georeferencing = false;
        }
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
      
      if (event.data == "Finish" || event.data == "Stopped") {
        worker.terminate();
        delete worker;
        
        if (event.data == "Finish") {
          me.page++;
          me.getRecords();
        } else {
          me.stopGeocoding();
        }
      } else {
        // Add new one to loader
        requests_queue.updateGeoreferencing(null);
        
        var params = {};
        if (event.data.Placemark != undefined) {
          params['the_geom'] = {"type":"Point","coordinates":[event.data.Placemark[0].Point.coordinates[0],event.data.Placemark[0].Point.coordinates[1]]};
          $.ajax({
            dataType: 'json',
            type: 'PUT',
            dataType: "text",
            headers: {"cartodbclient": true},
            url: '/api/v1/tables/addresses/records/'+event.data.cartodb_id,
            data: params,
            success: function(data) {},
            error: function(e, textStatus) {}
          });
        }
      }
    };
    
    $(window).bind('stopGeo',function(ev){
      worker.postMessage({process: 'stop', places: null});
    });

    worker.postMessage({process: 'start', places: directions});
	}



	/*============================================================================*/
	/* Stop geocoding	*/
	/*============================================================================*/
	Geocoding.prototype.stopGeocoding = function() {
	  $(window).unbind('stopGeo');
	  $('p.geo').removeClass('loading');
		georeferencing = false;
		requests_queue.stopGeoreferencing();
	}
	
	
	
  