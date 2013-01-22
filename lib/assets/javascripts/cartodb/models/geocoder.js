
(function() {


function Geocoding(address, table, geocoder) {
  this.georeferencing = false;
  this.address = address;
  this.table = table;
  this.geoCodingPace = 300; // one row each 300ms
  this.geocoder = geocoder || cdb.geo.geocoder.NOKIA;
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
  this.lastCartoDbId = 0;
  this.queue = [];
  this.current_connections = 0;
  this.total_connections = 0;
  this.totalRegisters = 0;
  this.errors = 0;
  // create the column to georef
  this.georeferencing = true;
  this._createGeorefColumn(function() {
    self.state = '';
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
  var sql = _.template("SELECT count(cartodb_id) from <%= table %> where cartodb_georef_status is NULL OR cartodb_georef_status is FALSE");
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
  var sql = _.template("SELECT * from <%= table %> where (cartodb_georef_status is " +
    " NULL OR cartodb_georef_status is FALSE) AND cartodb_id > "+this.lastCartoDbId +
    " order by cartodb_id limit <%= rows %> ");
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
  this.state = 'finished';
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
      self.lastCartoDbId = row['cartodb_id'];
      $.when(self.geocodeRow(row)).then(function() {
        self._next();
      });
    } else {
      self._feedQueue();
    }
  } else {
    self.bind('connectionFreed', function() {
      self.unbind('connectionFreed');
      self._next.bind(self);
    });
  }

}

Geocoding.prototype.getRowAddress = function(row) {
  var oldTemplateSettings= _.templateSettings;
  _.templateSettings = { interpolate : /\{(.+?)\}/g };
  var address = _.template(this.address, row).replace(/#/g, '');
  _.templateSettings = oldTemplateSettings;
  return address;
};

Geocoding.prototype.geocodeRow = function(row) {
  var self = this;
  var dfd = $.Deferred();

  try {
    var address = this.getRowAddress(row);
  } catch(err) {
    self.state = 'finished';
    self.trigger('templateError')
    this.georeferencing = false;
    return;
  }

  ++self.current_connections;
  ++self.total_connections;
  this.geocoder.geocode(address, function(coords) {
    --self.current_connections;
    self.trigger('connectionFreed');
    if(coords.length) {
      var coordinates = coords[0];
      var newProps = {
        the_geom: JSON.stringify({"type":"Point","coordinates":[coordinates.lon,coordinates.lat]}),
        cartodb_georef_status: true
      };

      $.when(self.table.data().getRow(row.cartodb_id).save(newProps, {
        silent: true
      })).done(function() {
        self.trigger('progress', self.total_connections, self.totalRegisters);
        self.table.data().getRow(row.cartodb_id).trigger('change');
        dfd.resolve();
      });
    } else {
      $.when(self.table.data().getRow(row.cartodb_id).save({
        cartodb_georef_status: false
      }, {
        silent: true
      })).done(function() {
        self.table.data().getRow(row.cartodb_id).trigger('change');
        self.trigger('progress', self.total_connections, self.totalRegisters);
        dfd.resolve();
      });;
    }

  });
  return dfd.promise();

};

cdb.admin.Geocoding = Geocoding;

})();
