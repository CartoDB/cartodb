
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

Geocoding.prototype._TEXTS = {
  start:          _t("Geocoding"),
  complete:       _t("Geocoding completed"),
  error:          _t("Geocoding error, please try again later..."),
  template_error: _t("The address template you've entered is incorrect!"),
  cancel:         _t("Geocoding canceled"),
  offline:        _t("Ouch! No internet connection :(...")
};

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
  this.totalGeolocatedRows = 0;
  // create the column to georef
  this.georeferencing = true;
  this._createGeorefColumn(function() {
    self._trigger("started", self._TEXTS.start, null, "");
    self._getTotalRegisters(function() {
      self._feedQueue();
    });
  });
  // Bind to check if user loses connection 
  window.addEventListener('offline', function() {
    self._trigger("offline", self._TEXTS.offline, false, 'finished');
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
  var sql = _.template("SELECT count(cartodb_id) FROM <%= table %> WHERE cartodb_georef_status IS NULL OR cartodb_georef_status IS FALSE");
  this.table.data()._sqlQuery(
    sql({
      table: self.table.get('name')
    }),
    function(data) {
      if(data.rows.length) {
        self.totalRegisters = data.rows[0].count;
        if (self.totalRegisters == 0) {
          self._trigger('no-data', "", null, null);
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
  var sql = _.template("SELECT * FROM <%= table %> WHERE (cartodb_georef_status IS " +
    " NULL OR cartodb_georef_status IS FALSE) AND cartodb_id > "+this.lastCartoDbId +
    " ORDER BY cartodb_georef_status ASC LIMIT <%= rows %> ");

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
        self._trigger("finished", self._TEXTS.complete, false, 'finished');
      }
    }
  );
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
        ++self.totalGeolocatedRows;
        if (self.totalGeolocatedRows === 1) {
          self.table.trigger('geolocated');
        }
      }).fail(function(e) {
        self._trigger("error", self._TEXTS.error, false, 'finished');
        return;
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
    self._trigger("templateError", self._TEXTS.template_error, false, 'finished');
    return;
  }

  ++self.current_connections;
  ++self.total_connections;
  this.geocoder.geocode(address, function(coords) {
    --self.current_connections;
    self.trigger('connectionFreed');
    var r = self.table.data().getRow(row.cartodb_id, { no_add: true });
    if(coords.length) {
      var coordinates = coords[0];
      var newProps = {
        the_geom: JSON.stringify({"type":"Point","coordinates":[coordinates.lon,coordinates.lat]}),
        cartodb_georef_status: true
      };

      $.when(r.save(newProps, {
        silent: true
      })).done(function() {
        self.trigger('progress', self.total_connections, self.totalRegisters);
        r.trigger('change');
        dfd.resolve();
      }).fail(function(e) {
        self._trigger("error", self._TEXTS.error, false, 'finished');
        return;
      });
    } else {
      $.when(r.save({
        cartodb_georef_status: false
      }, {
        silent: true
      })).done(function() {
        r.trigger('change');
        self.trigger('progress', self.total_connections, self.totalRegisters);
        dfd.resolve();
      }).fail(function(e) {
        self._trigger("error", self._TEXTS.error, false, 'finished');
        return;
      });
    }

  });
  return dfd.promise();
};

Geocoding.prototype._trigger = function(type, msg, georeferencing, state) {
  if (georeferencing != undefined && georeferencing != null) this.georeferencing = georeferencing;
  if (state) this.state = state;
  if (type != "started") window.removeEventListener('offline');
  this.trigger(type, type, msg);
}

cdb.admin.Geocoding = Geocoding;

})();
