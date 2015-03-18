var cdb = require('cartodb.js');
var Backbone = require('backbone');
var ImportsModel = require('../../imports_model');

/**
 *  This model will be on charge of create a new map
 *  using:
 *  
 *  A) user selected datasets
 *  B) new empty dataset
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'map',
    currentImport: null,
    tableIdsArray: [],
    selectedDatasets: []
  },

  _DEFAULT_MAP_NAME: 'Untitled Map',

  initialize: function(attrs, opts) {
    this.user = opts.user;
  },

  start: function() {
    this._checkCollection();
  },

  _checkCollection: function() {
    if (this.get('selectedDatasets').length > 0) {
      this._importDataset(this.get('selectedDatasets').pop());
    } else {
      this.set('currentImport', '');
      this._createMap();
    }
  },

  _importDataset: function(mdl) {
    var tableIdsArray = _.clone(this.get('tableIdsArray'));
    var perm = new cdb.admin.Permission(mdl.permission);
    var isOwner = perm.isOwner(this.user)

    if (!isOwner || mdl.type === "remote" || mdl.type === "liked") {
      var d = {
        create_vis: false
      };

      if (mdl.type === "remote") {
        _.extend(d, {
          type: 'remote',
          value: mdl.name,
          remote_visualization_id: mdl.id,
          size: mdl.table && mdl.table.size
        });
      }

      if (!isOwner || mdl.type === "liked") {
        var importURL =
          cdb.config.get('sql_api_protocol') + '://' +
          mdl.permission.owner.username + '.' + cdb.config.get('sql_api_domain') + ':' + cdb.config.get('sql_api_port') +
          cdb.config.get('sql_api_endpoint') + '?q=SELECT * FROM ' + mdl.name + "&export=SHP";
        
        _.extend(d, {
          type: 'url',
          value: importURL,
          service_item_id: mdl.name
        });
      }

      var impModel = new ImportsModel({ upload: d }, { user: this.user });
      this.set('currentImport', _.clone(impModel));
      this.trigger('importingRemote', this);

      impModel.bind('change:state', function(m) {
        if (m.hasCompleted()) {
          var data = m.imp.toJSON();
          tableIdsArray.push(data.table_name);
          this.set('tableIdsArray', tableIdsArray);
          this._checkCollection();
          this.trigger('importCompleted', this);
        }
        if (m.hasFailed()) {
          this.trigger('importFailed', this);
        }
      }, this);
    } else {
      tableIdsArray.push(mdl.name);
      this.set({
        currentImport: '',
        tableIdsArray: tableIdsArray
      });
      this._checkCollection();
    }
  },

  _createMap: function() {
    var self = this;
    var vis = new cdb.admin.Visualization({
      name: this._DEFAULT_MAP_NAME,
      type: 'derived'
    });

    this.trigger('creatingMap', this);

    vis.save({
      tables: this.get('tableIdsArray')
    },{
      success: function(m) {
        self.trigger('mapCreated', m, self);
      },
      error: function(e) {
        self.trigger('mapError', self);
      }
    });
  }

});
