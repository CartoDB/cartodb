var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
var WidgetsFormFactory = require('./widgets-form-factory');

/**
 * View to render widgets form
 */
module.exports = cdb.core.View.extend({

  initialize: function () {
    if (!this.options.widgetDefinitionModel) {
      throw new Error('A WidgetDefinitionModel should be provided');
    }

    this.widgetDefinitionModel = this.options.widgetDefinitionModel;

    this.formModel = WidgetsFormFactory.createWidgetFormModel(this.widgetDefinitionModel.toJSON());
  },

  _initViews: function () {
    this.widgetFormView = new Backbone.Form({
      model: this.formModel
    });
    this.$el.append(this.widgetFormView.render().$el);
    this.addView(this.widgetFormView);
  },

  render: function () {
    this._initViews();
    return this;
  }
});
