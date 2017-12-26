var _ = require('underscore');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var CoreView = require('backbone/core-view');
var InfowindowSelectView = require('./infowindow-select-view');
var InfowindowItemsView = require('./infowindow-items-view');
var CarouselCollection = require('../../../../components/custom-carousel/custom-carousel-collection');
var loadingTemplate = require('../../panel-loading-template.tpl');
var OverlayView = require('../../../components/overlay/overlay-view');

var REQUIRED_OPTS = [
  'querySchemaModel',
  'layerDefinitionModel',
  'templates',
  'overlayModel',
  'editorModel'
];

/**
 * Select for an Infowindow select type.
 */
module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initCollection();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._querySchemaModel.isFetched()
      ? this._initViews()
      : this._renderStateless();

    this._renderOverlay();

    return this;
  },

  _renderStateless: function () {
    this.$el.append(
      loadingTemplate()
    );
  },

  _renderOverlay: function () {
    var view = new OverlayView({
      overlayModel: this._overlayModel
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _initCollection: function () {
    this._templatesCollection = new CarouselCollection(
      _.map(this._templates, function (template) {
        return {
          selected: this.model.get('template_name') === template.value,
          val: template.value,
          label: template.label,
          template: function () {
            return (template.infowindowIcon && template.infowindowIcon()) || template.value;
          },
          tooltip: template.tooltip
        };
      }, this)
    );
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:template_name', this._renderItems);
    this.listenTo(this.model, 'change:template', this._updateEditor);

    if (!this._querySchemaModel.isFetched()) {
      // status can be: fetched, unavailable, fetching
      this.listenTo(this._querySchemaModel, 'change:status', this.render);
      this._querySchemaModel.fetch();
    }
  },

  _updateEditor: function () {
    this._editorModel.set('disabled', !this.model.hasTemplate());
  },

  _initViews: function () {
    var selectView = new InfowindowSelectView({
      model: this.model,
      templatesCollection: this._templatesCollection
    });
    this.addView(selectView);
    this.$el.append(selectView.render().el);

    this._renderItems();
  },

  _renderItems: function () {
    if (this._itemsView) {
      this.removeView(this._itemsView);
      this._itemsView.clean();
    }

    this._itemsView = new InfowindowItemsView({
      model: this.model,
      querySchemaModel: this._querySchemaModel,
      layerDefinitionModel: this._layerDefinitionModel,
      hasValidTemplate: !!this._checkValidTemplate()
    });
    this.addView(this._itemsView);
    this.$el.append(this._itemsView.render().el);
  },

  _checkValidTemplate: function () {
    var template = this._templatesCollection.find(function (mdl) {
      return this.model.get('template_name') === mdl.get('val');
    }, this);

    return template && template.get('val') !== '';
  }
});
