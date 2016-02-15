var cdb = require('cartodb-deep-insights.js');
var WidgetFormFactory = require('./widgets-form-factory');
var Backbone = require('backbone');
require('../../../components/form-components/index');

/**
 *  View of form to edit a widget definition's data
 *
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
    if (this._widgetFormView) this._widgetFormView.remove();
    this._widgetFormView = new Backbone.Form({
      model: this._widgetFormModel
    });
    this._widgetFormView.bind('change', function () {
      var errors = this.commit();
      console.log('errors', errors);
    });
    this.$el.html(this._widgetFormView.render().$el);

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
