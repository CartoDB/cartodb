  
  function Geocoding(address,table) {
    if (!georeferencing) {
      this.address = address;
      this.table = table_name;
      this.page = 0;
			

      // Get the total and start loader
      this.getTotalRecords();
      
      // Georeferencing state -> true
      georeferencing = true;
      $('p.geo').addClass('loading');
    }
  }



	/*============================================================================*/
	/* Start worker geocoding	*/
	/*============================================================================*/
	Geocoding.prototype.getTotalRecords = function() {
	  var me = this;

		$.ajax({
      method: "GET",
      url: global_api_url+'queries?sql='+escape("SELECT * from "+this.table+" where the_geom is null"),
      headers: {'cartodbclient':true},
      dataType:'jsonp',
      data: {rows_per_page:100,page:me.page},
      success: function(result) {
				me.requestId = createUniqueId();
		    requests_queue.startGeoreferencing(me.requestId,result.total_rows);
		    me.getRecords();
      }
    });
	}



  
  
  /*============================================================================*/
	/* Start worker geocoding	*/
	/*============================================================================*/
	Geocoding.prototype.getRecords = function() {
	  var me = this;
		
		var template = _.templateSettings = {
		  interpolate : /\{(.+?)\}/g
		};
		
	
		$.ajax({
      method: "GET",
      url: global_api_url+'queries?sql='+escape("SELECT * from "+this.table+" where the_geom is null"),
      headers: {'cartodbclient':true},
      dataType:'jsonp',
      data: {rows_per_page:100,page:me.page},
      success: function(result) {				
        var rows = result.rows,
						addresses = [];
				_.each(rows,function(row,i){
					addresses.push({cartodb_id:row.cartodb_id,address:_.template(me.address,row)});
				});

        if (result.rows!=null && result.rows.length>0) {
          // Update loader
          requests_queue.updateGeoreferencing(result.total_rows);
          me.processGeocoding(addresses);
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
            url: '/api/v1/tables/'+me.table+'/records/'+event.data.cartodb_id,
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
	
	
	
  