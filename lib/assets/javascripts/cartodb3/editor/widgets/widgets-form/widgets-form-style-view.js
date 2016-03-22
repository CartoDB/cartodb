var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var WidgetFormFactory = require('./widgets-form-factory');
var Backbone = require('backbone');
var Template = require('./widgets-form-style.tpl');
require('../../../components/form-components/index');

/**
 * View of form to edit a widget definition's style
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');

    this._widgetDefinitionModel = opts.widgetDefinitionModel;

    this._widgetFormModel = WidgetFormFactory.createWidgetFormStyleModel(this._widgetDefinitionModel);
    var debouncedOnFormChange = _.debounce(this._onFormChange.bind(this), 500);
    this._widgetFormModel.bind('change', debouncedOnFormChange);
    this.add_related_model(this._widgetFormModel);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(Template({
      title: _t('editor.widgets.widgets-form.style.title-label'),
      description: _t('editor.widgets.widgets-form.style.description')
    }));
    this._initViews();
    return this;
  },

  _initViews: function () {
    if (this._widgetFormView) {
      this._widgetFormView.remove();
    }

    this._widgetFormView = new Backbone.Form({
      model: this._widgetFormModel
    });

    this._widgetFormView.bind('change', function () {
      this.commit();
    });

    this.$('.js-content').html(this._widgetFormView.render().$el);
  },

  clean: function () {
    // Backbone.Form removes the view with the following method
    this._widgetFormView.remove();
    cdb.core.View.prototype.clean.call(this);
  },

  _onFormChange: function () {
    var attrs = _.clone(this._widgetFormModel.attributes);

    // Make sure sync_on-attrs are really booleans
    attrs.sync_on_bbox_change = attrs.sync_on_bbox_change !== '';
    attrs.sync_on_data_change = attrs.sync_on_data_change !== '';

    this._widgetFormModel.updateWidgetDefinitionModel(this._widgetDefinitionModel);
  }

});
