
(function() {


function Geocoding(address, table, geocoder) {
  this.georeferencing = false;
  this.address = address;
  this.table = table;
  this.geoCodingPace = 300; // one row each 300ms
  this.geocoder = geocoder || cdb.geo.geocoder.YAHOO;
}

_.extend(Geocoding.prototype, Backbone.Events);

//
// public methods
//


/**
 * start the georeferencing
 */
Geocoding.prototype.start = function() {
  var self = this;
  this.queue = [];
  this.current_connections = 0;
  this.total_connections = 0;
  this.avgResponseTime = this.geoCodingPace;
  this.totalTime = 0;
  this.totalRegisters = 0;
  this.errors = 0;
  // create the column to georef
  this.georeferencing = true;

  this._createGeorefColumn(function() {
    self.trigger('started');
    self._getTotalRegisters(function() {
      self._feedQueue();
    });
  });
};

/**
 * change the address
 */
Geocoding.prototype.setAddress = function(address) {
  this.address = address;
};

/**
 * cancel the current progress
 */
Geocoding.prototype.cancel = function() {
  this.georeferencing = false;
};

//
// private methods
//

Geocoding.prototype._createGeorefColumn = function(done) {
  if(!this.table.containsColumn('cartodb_georef_status')) {
    this.table.addColumn('cartodb_georef_status', 'boolean', done);
  } else {
    done();
  }
};

/**
 * get total registers, only for stats pourposes
 */
Geocoding.prototype._getTotalRegisters = function(done) {
  var self = this;
  var sql = _.template("SELECT count(cartodb_id) from <%= table %> where cartodb_georef_status is NULL");
  this.table.data()._sqlQuery(
    sql({
      table: self.table.get('name')
    }),
    function(data) {
      if(data.rows.length) {
        self.totalRegisters = data.rows[0].count;
        if (self.totalRegisters == 0) {
          self.trigger('no-data');
        }
      }
      done();
    });
};

/**
 * fetch rows with cartodb_georef_status == NULL and put them on the quere to be georeferenced.
 * You can specify the number of rows to be fecthed, 100 by default
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
  this.georeferencing = false;
  this.trigger('finished');
}


Geocoding.prototype._next = function() {
  if(!this.georeferencing)  {
    return;
  }

  var self = this;
  if(self.current_connections< 10) {
    var row = this.queue.shift();
    if(row) {
      self.geocodeRow(row);
      // push a little bit more than avg time response
      setTimeout(_.bind(self._next, self), this.avgResponseTime*0.9);
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
    self.trigger('progress', self.total_connections, self.totalRegisters);
  });

};

cdb.admin.Geocoding = Geocoding;

})();
