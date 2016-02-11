var cdb = require('cartodb.js');
var $ = require('jquery');
var WidgetFormFactory = require('./widgets-form-factory');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;

/**
 * View of form to edit a widget definition's data
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.tableModel) throw new Error('tableModel is required');

    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._tableModel = opts.tableModel;

    this._widgetFormModel = WidgetFormFactory.createWidgetFormDataModel(this._widgetDefinitionModel, this._tableModel);
    this._widgetFormModel.bind('change', this._widgetFormModel.updateDefinitionModel, this._widgetFormModel);
  },

  render: function () {
    if (this._widgetFormView) this._widgetFormView.remove();
    this._widgetFormView = new Backbone.Form({
      model: this._widgetFormModel
    });
    this._widgetFormView.bind('change', function () {
      var errors = this.commit();
      console.log('errors', errors);
    });
    this.$el.html(this._widgetFormView.render().$el);

    // Missing columns, fetch the table data and show a unselectable loading indicator for the time being
    if (!this._tableModel.get('fetched')) {
      this._tableModel.fetch({
        success: this._updateSchema.bind(this)
      });
    }

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
