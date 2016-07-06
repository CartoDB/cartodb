var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var WidgetFormFactory = require('./widgets-form-factory');
var Template = require('./widgets-form-style.tpl');
require('../../../components/form-components/index');

/**
 * View of form to edit a widget definition's style
 */
module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');

    this._userActions = opts.userActions;
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
    CoreView.prototype.clean.call(this);
  },

  _onFormChange: function () {
    var attrs = _.clone(this._widgetFormModel.attributes);

    // Make sure sync_on-attrs are really booleans
    attrs.sync_on_bbox_change = attrs.sync_on_bbox_change !== '';
    attrs.sync_on_data_change = attrs.sync_on_data_change !== '';

    this._widgetFormModel.changeWidgetDefinitionModel(this._widgetDefinitionModel);
    this._userActions.saveWidget(this._widgetDefinitionModel);
  }

});
