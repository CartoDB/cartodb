var cdb = require('cartodb.js');
var Backbone = require('backbone');
var ImportsModel = require('../../imports_model');

/**
 *  This model will be on charge of create a new map
 *  using user selected datasets, where they can be
 *  already imported datasets or remote (and needed to import)
 *  datasets.    
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

    if (mdl.type === "remote") {
      var d = {
        create_vis: false,
        type: 'remote',
        value: mdl.name,
        remote_visualization_id: mdl.id,
        size: mdl.external_source && mdl.external_source.size
      };

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

      // If import model has any errors at the beginning
      if (impModel.hasFailed()) {
        this.trigger('importFailed', this);
      }
    } else {
      var table = new cdb.admin.CartoDBTableMetadata(mdl.table);
      tableIdsArray.push(table.get('name'));
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
