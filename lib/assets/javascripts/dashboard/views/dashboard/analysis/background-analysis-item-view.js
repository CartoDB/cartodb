const CoreView = require('backbone/core-view');
const template = require('./background-analysis-item.tpl');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'visModel'
];

module.exports = CoreView.extend({

  className: 'ImportItem',
  tagName: 'li',

  events: {
    'click .js-abort': '_removeItem',
    'click .js-show_dialog': '_showDialog',
    'click .js-close': '_removeItem'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._initBinds();
  },

  render: function () {
    const totalItems = this.collection.getTotalAnalysis();
    const totalAnalyzed = this.collection.getCompletedAnalysis();
    const totalSuccess = this.collection.getSuccessfullyAnalysedColumns();

    const templateData = {
      totalSuccess,
      totalItems,
      totalAnalyzed,
      progress: (totalAnalyzed / totalItems) * 100
    };

    this.$el.html(template(templateData));

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.collection, 'change:state', this._onChangeState);
  },

  _onChangeState: function () {
    const totalItems = this.collection.getTotalAnalysis();
    const totalAnalyzed = this.collection.getCompletedAnalysis();
    const totalSuccess = this.collection.getSuccessfullyAnalysedColumns();

    this.render();

    if (totalAnalyzed === totalItems && totalSuccess === 0) {
      this._removeItem();
    }
  },

  _showDialog: function () {
    // TODO: Pecan missing
    // const pecanDialog = new PecanDialog({
    //   visModel: this._visModel,
    //   collection: this.collection,
    //   userModel: this._userModel
    // });

    // pecanDialog.appendToBody();
  },

  _skip: function () {
    const layerID = this._visModel.get('active_layer_id');
    const activeLayer = this._visModel.map.layers.where({ id: layerID });
    let name;

    if (activeLayer) {
      name = activeLayer[0].table.get('name');
    }

    const skipPecanDialog = `pecan_${this.user.get('username')}_${name}`;
    localStorage[skipPecanDialog] = true;
  },

  _removeItem: function () {
    this.trigger('remove', this.collection, this);
    this._skip();
    this.clean();
  }

});
