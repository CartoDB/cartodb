var CoreView = require('backbone/core-view');
var template = require('./edit-geometry-content.tpl');
var EditGeometryHeaderView = require('./edit-geometry-content-views/edit-geometry-header-view');

module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._configModel = opts.configModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();
    return this;
  },

  _initViews: function () {
    this._renderHeader();
    this._renderContent();
  },

  _renderContent: function () {
    console.log('view is not implemented yet');
  },

  _renderHeader: function () {
    if (this._headerView) {
      this.removeView(this._headerView);
      this._headerView.clean();
    }

    this._headerView = new EditGeometryHeaderView({
      configModel: this._configModel,
      layerDefinitionModel: this._layerDefinitionModel
    });
    this.addView(this._headerView);
    this.$('.js-editGeometryHeader').html(this._headerView.render().el);
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep(this._layerDefinitionModel, 'layer-content');
  }

});
