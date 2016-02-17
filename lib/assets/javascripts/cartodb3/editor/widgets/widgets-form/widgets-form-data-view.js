var cdb = require('cartodb.js');
var $ = require('jquery');
var WidgetFormFactory = require('./widgets-form-factory');
var Backbone = require('backbone');
var Template = require('./widgets-form-data.tpl');
require('backbone-forms');
Backbone.$ = $;

/**
 * View of form to edit a widget definition's data
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.tableModel) throw new Error('tableModel is required');

    this._tableModel = opts.tableModel;

    this._widgetFormModel = WidgetFormFactory.createWidgetFormDataModel(opts.widgetDefinitionModel, this._tableModel);
    this._widgetFormModel.updateSchema();
    this._widgetFormModel.bind('change', this._widgetFormModel.updateDefinitionModel, this._widgetFormModel);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(Template({
      title: _t('editor.widgets.widgets-form.data.title'),
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
      var errors = this.commit();
      console.log('errors', errors);
    });

    this.$('.js-content').html(this._widgetFormView.render().$el);

    return this;
  },

  clean: function () {
    // Backbone.Form removes the view with the following method
    this._widgetFormView.remove();
    cdb.core.View.prototype.clean.call(this);
  },

  _updateSchema: function () {
    this._widgetFormModel.updateSchema();
    this.render();
  }
});
