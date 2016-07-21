var _ = require('underscore');
var CoreView = require('backbone/core-view');
var InfowindowSelectView = require('./infowindow-select-view');
var InfowindowItemsView = require('./infowindow-items-view');
var CarouselCollection = require('../../../../components/custom-carousel/custom-carousel-collection');
var styleFormNotReadyTemplate = require('../../../style/style-form-not-ready.tpl');
var OverlayView = require('../../../components/overlay/overlay-view');

/**
 * Select for an Infowindow select type.
 */
module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.templates) throw new Error('templates is required');
    if (!opts.overlayModel) throw new Error('overlayModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._overlayModel = opts.overlayModel;
    this._templates = opts.templates;
    this._editorModel = opts.editorModel;

    this._initCollection();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._querySchemaModel.get('status') === 'fetched') {
      this._initViews();
    } else {
      this._renderStateless();
    }
    this._renderOverlay();

    return this;
  },

  _renderStateless: function () {
    this.$el.append(
      styleFormNotReadyTemplate()
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
          }
        };
      }, this)
    );
  },

  _initBinds: function () {
    this.model.bind('change:template_name', this._renderItems, this);
    this.model.bind('change:template', this._updateEditor, this);

    if (this._querySchemaModel.get('status') !== 'fetched') {
      // status can be: fetched, unavailable, fetching
      this._querySchemaModel.bind('change:status', this.render, this);
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
