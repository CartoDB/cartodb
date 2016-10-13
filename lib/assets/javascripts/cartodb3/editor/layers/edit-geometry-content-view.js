var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-geometry-content.tpl');
var EditGeometryHeaderView = require('./edit-geometry-content-views/edit-geometry-header-view');
var EditGeometryFormView = require('./edit-geometry-content-views/edit-geometry-form-view');

module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.geometry) throw new Error('geometry is required');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._configModel = opts.configModel;
    this._geometry = opts.geometry;

    this.geometryModel = new Backbone.Model(this._geometry);
    this.geometryModel.bind('change', function() {
      console.log(JSON.stringify(this.geometryModel));
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();
    return this;
  },

  _initViews: function () {
    this._renderHeader();
    this._renderForm();
  },

  _renderHeader: function () {
    if (this._headerView) {
      this.removeView(this._headerView);
      this._headerView.clean();
    }

    this._headerView = new EditGeometryHeaderView({
      configModel: this._configModel,
      layerDefinitionModel: this._layerDefinitionModel,
      geometryModel: this.geometryModel
    });
    this.addView(this._headerView);
    this.$('.js-editGeometryHeader').html(this._headerView.render().el);
  },

  _renderForm: function () {
    if (this._editGeometryFormView) {
      this.removeView(this._editGeometryFormView);
      this._editGeometryFormView.clean();
    }
    this._editGeometryFormView = new EditGeometryFormView({
      model: this.geometryModel
    });
    this.addView(this._editGeometryFormView);
    this.$('.js-editGeometryContent').append(this._editGeometryFormView.render().el);
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep(this._layerDefinitionModel, 'layer-content');
  }

});
