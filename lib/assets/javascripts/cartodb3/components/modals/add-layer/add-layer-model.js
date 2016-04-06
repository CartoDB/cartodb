var cdb = require('cartodb-deep-insights.js');
var Backbone = require('backbone');
var UploadModel = require('../../../data/upload-model');
var VisualizationFetchModel = require('../../../data/visualizations-fetch-model');
var TablesCollection = require('../../../data/visualizations-collection');
var TableModel = require('../../../data/table-model');
var camshaftReference = require('../../../data/camshaft-reference');
var _ = require('underscore');

/**
 * Add layer model
 *
 * "Implements" the CreateListingModel.
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    type: 'addLayer',
    contentPane: 'listing', // [listing, loading]
    listing: 'datasets', // [import, datasets, scratch]
    collectionFetched: false,
    activeImportPane: 'file'
  },

  initialize: function (attrs, opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.visMap) throw new Error('visMap is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._userModel = opts.userModel;
    this._visMap = opts.visMap;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._configModel = opts.configModel;

    this._uploadModel = new UploadModel({
      create_vis: false
    }, {
      userModel: this._userModel,
      configModel: this._configModel
    });

    this._selectedDatasetsCollection = new Backbone.Collection();
    this._tablesCollection = new TablesCollection([], {
      configModel: this._configModel
    });
    this._visualizationFetchModel = new VisualizationFetchModel({
      content_type: 'datasets',
      library: this.showLibrary()
    });
    this._initBinds();
    this._maybePrefetchDatasets();
  },

  getTablesCollection: function () {
    return this._tablesCollection;
  },

  getSelectedDatasetsCollection: function () {
    return this._selectedDatasetsCollection;
  },

  getVisualizationFetchModel: function () {
    return this._visualizationFetchModel;
  },

  getUploadModel: function () {
    return this._uploadModel;
  },

  canSelect: function (dataset) {
    return dataset.get('selected') || this._selectedDatasetsCollection.length < 1; // for now only allow 1 item
  },

  showLibrary: function () {
    return false;
  },

  showDatasets: function () {
    return true;
  },

  setActiveImportPane: function (name) {
    this.set('activeImportPane', name);
  },

  canFinish: function () {
    if (this.get('listing') === 'import') {
      return this._uploadModel.isValidToUpload();
    } else if (this.get('listing') === 'datasets') {
      return this._selectedDatasetsCollection.length > 0;
    }
  },

  finish: function () {
    if (this.get('listing') === 'import') {
      cdb.god.trigger('importByUploadData', this._uploadModel.toJSON(), this);
    } else if (this.get('listing') === 'datasets') {
      var mdl = this._selectedDatasetsCollection.at(0);
      if (mdl.get('type') === 'remote') {
        var d = {
          create_vis: false,
          type: 'remote',
          value: mdl.get('name'),
          remote_visualization_id: mdl.get('id'),
          size: mdl.get('external_source') ? mdl.get('external_source').size : undefined
        };
        // See BackgroundImporter where the same event is bound to be handled..
        cdb.god.trigger('importByUploadData', d, this);
      } else {
        this._addNewLayer(mdl.getTableModel());
      }
    }
  },

  getImportState: function () {
    return this.get('activeImportPane');
  },

  showGuessingToggler: function () {
    return this.get('listing') === 'import';
  },

  showPrivacyToggler: function () {
    return this.get('listing') === 'import';
  },

  createFromScratch: function () {
    var self = this;
    this.set('contentPane', 'creatingFromScratch');
    var tableModel = new TableModel({}, {
      configModel: this._configModel
    });
    tableModel.save({}, {
      success: function () {
        self._addNewLayer(tableModel);
      },
      error: function () {
        self.set('contentPane', 'addLayerFailed');
      }
    });
  },

  _initBinds: function () {
    this._uploadModel.bind('change', function () {
      this.trigger('change:upload', this);
    }, this);
    this._visualizationFetchModel.bind('change', this._fetchCollection, this);
    this.bind('change:listing', this._maybePrefetchDatasets);

    this._tablesCollection.bind('change:selected', function (changedModel, wasSelected) {
      this._selectedDatasetsCollection[ wasSelected ? 'add' : 'remove' ](changedModel);
    }, this);
    this._tablesCollection.bind('sync', function () {
      this._selectedDatasetsCollection.each(function (model) {
        var sameModel = this._tablesCollection.get(model.id);
        if (sameModel) {
          sameModel.set('selected', true);
        }
      }, this);
    }, this);
  },

  _maybePrefetchDatasets: function () {
    if (this.get('listing') === 'datasets' && !this.get('collectionFetched') && !this._visualizationFetchModel.isSearching()) {
      this.set('collectionFetched', true);
      this._fetchCollection();
    }
  },

  _fetchCollection: function () {
    var params = this._visualizationFetchModel.attributes;
    var types;

    if (this._visualizationFetchModel.isSearching()) {
      // Supporting search in data library and user datasets at the same time
      types = 'table,remote';
    } else {
      types = params.library ? 'remote' : 'table';
    }

    this._tablesCollection.fetch({
      data: {
        locked: '',
        q: params.q,
        page: params.page,
        tags: params.tag,
        shared: params.shared,
        only_liked: params.liked,
        type: '',
        types: types
      }
    });
  },

  _onCollectionChange: function () {
    this._selectedDatasetsCollection.reset(
      this._tablesCollection.where({ selected: true })
    );
  },

  _addNewLayer: function (tableModel) {
    var self = this;
    var tableName = tableModel.get('name');

    this.set('contentPane', 'addingNewLayer');

    // based on https://github.com/CartoDB/cartodb/blob/132d4589c19cfa47826e20f617a74074b364b049/lib/assets/javascripts/cartodb/models/cartodb_layer.js#L214-L219
    var m = window.layerDefinitionsCollection.first();
    var attrs = JSON.parse(JSON.stringify(m.toJSON())); // deep clone
    delete attrs.id;
    delete attrs.options.source;
    delete attrs.options.letter;
    delete attrs.options.query;
    attrs.options.table_name = tableName;
    attrs.options.tile_style = camshaftReference.getDefaultCartoCSSForType();
    attrs.order = _.max(this._layerDefinitionsCollection.pluck('order')) + 1;

    this._layerDefinitionsCollection.create(attrs, {
      wait: true,
      success: function () {
        self._layerDefinitionsCollection.sort();
        self.trigger('addLayerDone');
      },
      error: function () {
        self.set('contentPane', 'addLayerFailed');
      }
    });
  }

});
