var cdb = require('cartodb.js');
var $ = require('jquery');
var WidgetFormFactory = require('./widgets-form-factory');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;

/**
 * View to render widgets form
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');

    this._widgetDefinitionModel = opts.widgetDefinitionModel;

    this._widgetFormModel = WidgetFormFactory.createWidgetFormStyleModel(this._widgetDefinitionModel);
    this._widgetFormModel.bind('change', this._widgetFormModel.updateDefinitionModel, this._widgetFormModel);
    this._widgetFormModel.bind('changeSchema', this.render, this);
    this._widgetFormModel.updateSchema();
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
  }
});
