var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;

/**
 * View to render widgets form
 */
module.exports = cdb.core.View.extend({

  initialize: function () {
    if (!this.options.widgetDefinitionModel) {
      throw new Error('A WidgetDefinitionModel should be provided');
    }

    this.widgetDefinitionModel = this.options.widgetDefinitionModel;
    this.widgetDefinitionModel.bind('change:type', this._onWidgetDefinitionModelChange, this);
    this.add_related_model(this.widgetDefinitionModel);

    this._generateForm();
  },

  _onWidgetDefinitionModelChange: function () {
    this.widgetFormView.remove();
    this._generateForm();
    this.render();
  },

  _generateForm: function () {
    var widgetFormModel = this.widgetDefinitionModel.getFormModel();
    this.widgetFormView = new Backbone.Form({
      model: widgetFormModel
    });

    widgetFormModel.bind('update', function () {
      this._onWidgetDefinitionModelChange();
    }, this);

    this.widgetFormView.bind('change', function () {
      this.commit();
    });

    this.addView(this.widgetFormView);
  },

  render: function () {
    this.$el.append(this.widgetFormView.render().$el);
    return this;
  }
});
