  
  function Geocoding(address,table) {
    if (!georeferencing) {
      this.address = address;
      this.table = table_name;
			

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
    this.from = 0;

		$.ajax({
      method: "GET",
      url: global_api_url+'queries?sql='+escape("SELECT cartodb_georef_status from "+this.table+" where cartodb_georef_status is NULL OR cartodb_georef_status=false"),
      headers: {'cartodbclient':true},
      dataType:'jsonp',
      data: {rows_per_page:100},
      success: function(result) {
				me.requestId = createUniqueId();
		    window.ops_queue.startGeoreferencing(me.requestId,result.total_rows);
		    me.getRecords();
      },
			error: function(e) {
				createGeoreferencedColumn();
			}
    });

		// Column to know if this record has been georeferenced or not
		function createGeoreferencedColumn() {
			var params = {};
			params['name'] = 'cartodb_georef_status';
			params['type'] = "boolean";
			$.ajax({
        dataType: 'json',
        type: 'POST',
        dataType: "text",
        headers: {"cartodbclient": true},
        url: '/api/v1/tables/'+me.table+'/columns',
        data: params,
        success: function(data) {
					me.getTotalRecords();
				},
        error: function(e, textStatus) {}
      });
		}
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
      url: global_api_url+'queries?sql='+escape("SELECT * from "+this.table+" WHERE ( cartodb_georef_status is NULL OR cartodb_georef_status=false ) AND cartodb_id>" + me.from ),
      headers: {'cartodbclient':true},
      dataType:'jsonp',
      data: {rows_per_page:100, mode:'asc'},
      success: function(result) {
        var rows = result.rows,
						addresses = [];
				_.each(rows,function(row,i){
					addresses.push({cartodb_id:row.cartodb_id,address:_.template(me.address,row)});
          me.from = row.cartodb_id;
				});

        if (result.rows!=null && result.rows.length>0) {
          // Update loader
          me.processGeocoding(addresses);
        } else {
          window.ops_queue.finishGeoreferencing(me.requestId);
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
    var worker = new Worker("/javascripts/admin/show/view/geocoding_worker.js");

    worker.onmessage = function(event){
      
      if (event.data == "Finish" || event.data == "Stopped") {
        worker.terminate();
        delete worker;
        
        if (event.data == "Finish") {
          me.getRecords();
        } else {
          me.stopGeocoding();
        }
      } else {
        // Add new one to loader
        window.ops_queue.updateGeoreferencing(null);
        
        var params = {};
        params['cartodb_georef_status'] = false;

        if (event.data.query.results.ResultSet.Found != "0") {
          params['the_geom'] = {"type":"Point","coordinates":[event.data.query.results.ResultSet.Results.longitude,event.data.query.results.ResultSet.Results.latitude]};
          params['cartodb_georef_status'] = true;
        }
				
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
		window.ops_queue.stopGeoreferencing();
	}
	
	
	
  