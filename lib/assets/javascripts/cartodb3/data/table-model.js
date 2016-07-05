var _ = require('underscore');
var Backbone = require('backbone');
var TableColumnsCollection = require('./table-columns-collection');
var getSimpleGeometryType = require('./get-simple-geometry-type');
var PermissionModel = require('./permission-model');
var SyncModel = require('./synchronization-model');

/**
 * Model representing a table.
 */
module.exports = Backbone.Model.extend({

  idAttribute: 'name',

  defaults: {
    // always not fetched to begin with, since the only way to currently get table data is by an individual request
    fetched: false,
    schema: []
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
  },

  urlRoot: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('table');
    return baseUrl + '/api/' + version + '/tables';
  },

  parse: function (r, opts) {
    var configModel = (opts && opts.configModel) || this._configModel;

    if (r.synchronization) {
      if (!this._syncModel) {
        this._syncModel = new SyncModel(r.synchronization, {
          configModel: configModel
        });
      } else {
        this._syncModel.set(r.synchronization);
      }
    }

    if (r.permission) {
      if (!this._permissionModel) {
        this._permissionModel = new PermissionModel(r.permission, {
          configModel: configModel
        });
      } else {
        this._permissionModel.set(r.permission);
      }
    }

    var attrs = _.defaults({
      fetched: true
    }, r);

    var columnsAttrs = _.map(r.schema, function (d) {
      return {
        name: d[0],
        type: d[1]
      };
    }, this);

    if (!this.columnsCollection) {
      this.columnsCollection = new TableColumnsCollection(columnsAttrs, {
        configModel: configModel,
        tableModel: this
      });
    } else {
      this.columnsCollection.reset(columnsAttrs);
    }

    return attrs;
  },

  isOwner: function (userModel) {
    if (!userModel || !this._permissionModel) {
      return false;
    }
    return this._permissionModel.isOwner(userModel);
  },

  getUnqualifiedName: function () {
    var name = this.get('name');
    if (!name) return null;
    var tk = name.split('.');
    if (tk.length === 2) {
      return tk[1];
    }
    return name;
  },

  // "user".table -> user.table
  getUnquotedName: function () {
    var name = this.get('name');
    return name && name.replace(/"/g, '');
  },

  getGeometryType: function () {
    var types = this.get('geometry_types');
    var geomTypes = [];
    if (!_.isArray(types)) {
      return [];
    }

    for (var t in types) {
      var type = types[t];
      // when there are rows with no geo type null is returned as geotype
      if (type) {
        var a = getSimpleGeometryType(type.toLowerCase());
        if (a) {
          geomTypes.push(a);
        }
      }
    }

    return _.uniq(geomTypes);
  }
});
