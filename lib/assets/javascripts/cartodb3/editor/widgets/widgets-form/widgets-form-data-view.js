var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var WidgetFormFactory = require('./widgets-form-factory');
var Template = require('./widgets-form-data.tpl');
require('../../../components/form-components/index');

/**
 *  View of form to edit a widget definition's data
 *
 */
module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._userActions = opts.userActions;
    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._querySchemaModel = opts.querySchemaModel;

    this._widgetFormModel = WidgetFormFactory.createWidgetFormDataModel(opts.widgetDefinitionModel, this._querySchemaModel);
    this._widgetFormModel.updateSchema();
    this._widgetFormModel.bind('change', _.debounce(this._onFormChange.bind(this), 500));
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(Template({
      title: _t('editor.widgets.widgets-form.data.title-label'),
      description: _t('editor.widgets.widgets-form.data.description')
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

    return this;
  },

  clean: function () {
    // Backbone.Form removes the view with the following method
    this._widgetFormView.remove();
    CoreView.prototype.clean.call(this);
  },

  _onFormChange: function () {
    if (this._widgetFormModel.canSave()) {
      this._widgetDefinitionModel.set(this._widgetFormModel.attributes);
      this._userActions.saveWidget(this._widgetDefinitionModel);
    }
  }

});
