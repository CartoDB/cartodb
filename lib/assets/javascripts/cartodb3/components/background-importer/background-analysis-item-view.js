var cdb = require('cartodb.js-v3');
var PecanDialog = require('../../../dialogs/pecan/pecan_dialog_view');

module.exports = cdb.core.View.extend({

  className: 'ImportItem',
  tagName: 'li',

  events: {
    'click .js-abort': '_removeItem',
    'click .js-show_dialog': '_showDialog',
    'click .js-close': '_removeItem'
  },

  initialize: function () {
    this.user = this.options.user;
    this.vis = this.options.vis;
    this.template = cdb.templates.getTemplate('common/background_polling/views/analysis/background_analysis_item');
    this._initBinds();
  },

  render: function () {
    var totalItems = this.collection.getTotalAnalysis();
    var totalAnalyzed = this.collection.getCompletedAnalysis();
    var totalSuccess = this.collection.getSuccessfullyAnalysedColumns();

    var d = {
      totalSuccess: totalSuccess,
      totalItems: totalItems,
      totalAnalyzed: totalAnalyzed,
      progress: (totalAnalyzed / totalItems) * 100
    };

    this.$el.html(this.template(d));

    return this;
  },

  _initBinds: function () {
    this.collection.bind('change:state', this._onChangeState, this);
    this.add_related_model(this.collection);
  },

  _onChangeState: function () {
    var totalItems = this.collection.getTotalAnalysis();
    var totalAnalyzed = this.collection.getCompletedAnalysis();
    var totalSuccess = this.collection.getSuccessfullyAnalysedColumns();

    this.render();

    if (totalAnalyzed === totalItems && totalSuccess === 0) {
      this._removeItem();
    }
  },

  _showDialog: function () {
    var pecanDialog = new PecanDialog({
      clean_on_hide: true,
      vis: this.vis,
      collection: this.collection,
      user: this.user
    });

    pecanDialog.appendToBody();
  },

  _skip: function () {
    var layerID = this.vis.get('active_layer_id');
    var name;
    var activeLayer = this.vis.map.layers.where({ id: layerID });

    if (activeLayer) {
      name = activeLayer[0].table.get('name');
    }

    var skipPencanDialog = 'pecan_' + this.user.get('username') + '_' + name;
    localStorage[skipPencanDialog] = true;
  },

  _removeItem: function () {
    this.trigger('remove', this.collection, this);
    this._skip();
    this.clean();
  }

});
