
function Geocoding(address, table, geocoder) {
  this.georeferencing = false;
  this.address = address;
  this.table = table;
  this.geoCodingPace = 300; // one row each 300ms
  this.geocoder = geocoder || cdb.geo.geocoder.YAHOO;

  this.queue = [];
  this.current_connections = 0;
  this.total_connections = 0;
  this.avgResponseTime = this.geoCodingPace;
  this.totalTime = 0;

  // Get the total and start loader
  //this.getTotalRecords();

  // Georeferencing state -> true
  //georeferencing = true;
  //this.trigger('loading');

}

_.extend(Geocoding.prototype, Backbone.Events);

Geocoding.prototype._createGeorefColumn = function(done) {
  if(!this.table.containsColumn('cartodb_georef_status')) {
    this.table.addColumn('cartodb_georef_status', 'boolean', done);
  } else {
    done();
  }
}


/**
 * fetch rows and put them on the quere to be georeferenced
 */
Geocoding.prototype._feedQueue = function(rows) {
  var self = this;
  rows = rows || 100;
  var sql = _.template("SELECT * from <%= table %> where cartodb_georef_status is NULL order by cartodb_id limit <%= rows %> ");
  this.table.data()._sqlQuery(
    sql({
      table: self.table.get('name'),
      rows: rows
    }),
    function(data) {
      if(data.rows.length) {
        self.queue = self.queue.concat(data.rows);
        self._next();
      } else {
        self._finished();
      }
    }
  );
}

// the georeference has finished, stop the timers
Geocoding.prototype._finished = function() {
  console.log("FNISHED");
  console.log("total entries: " + this.total_connections);
}

Geocoding.prototype.start = function() {
  var self = this;
  // create the column to georef
  this._createGeorefColumn(function() {
    self._feedQueue();
  });
}


Geocoding.prototype._next = function() {
  var self = this;
  if(self.current_connections< 10) {
    var row = this.queue.shift();
    if(row) {
      self.geocodeRow(row);
      setTimeout(_.bind(self._next, self), this.avgResponseTime*1.3);
    } else {
      self._feedQueue();
    }
  } else {
      setTimeout(_.bind(self._next, self), this.geoCodingPace);
  }

}

Geocoding.prototype.geocodeRow = function(row) {
  var self = this;

  var oldTemplateSettings= _.templateSettings; 
  _.templateSettings = { interpolate : /\{(.+?)\}/g };
  var address = _.template(this.address, row);
  _.templateSettings = oldTemplateSettings;


  ++self.current_connections;
  ++self.total_connections;
  var t0 = new Date().getTime();
  this.geocoder.geocode(address, function(coords) {
    self.totalTime += new Date().getTime() - t0;
    self.avgResponseTime = self.totalTime/self.total_connections;
    --self.current_connections;
    console.log(self.avgResponseTime, address, coords);
    if(coords.length) {
      var coordinates = coords[0];
      self.table.data().getRow(row.cartodb_id).save({
        the_geom: {
          "type":"Point",
          "coordinates":[
            coordinates.lon,
            coordinates.lat 
          ]
        },
        cartodb_georef_status: true
      });
    } else {
      self.table.data().getRow(row.cartodb_id).save({
        cartodb_georef_status: false
      });
    }
  });

}

/*



  
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

        if (event.data && event.data.query && event.data.query.results && event.data.query.results.ResultSet && event.data.query.results.ResultSet.Found != "0") {

          // Could be an array or an object |arg!
          var coordinates = {};
          if (_.isArray(event.data.query.results.ResultSet.Results)) {
            coordinates.lat = event.data.query.results.ResultSet.Results[0].latitude;
            coordinates.lon = event.data.query.results.ResultSet.Results[0].longitude;
          } else {
            coordinates.lat = event.data.query.results.ResultSet.Results.latitude;
            coordinates.lon = event.data.query.results.ResultSet.Results.longitude;
          }

          params['the_geom'] = {"type":"Point","coordinates":[coordinates.lon,coordinates.lat]};
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



    Geocoding.prototype.stopGeocoding = function() {
      $(window).unbind('stopGeo');
      $('p.geo').removeClass('loading');
        georeferencing = false;
        window.ops_queue.stopGeoreferencing();
    }
    
    
    
  
  */
