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

    this._generateForm();
  },

  _initBinds: function () {
    this.widgetDefinitionModel.bind('change:type', this._onWidgetDefinitionModelChange, this);

    this.formModel.bind('change', function () {
      this.widgetDefinitionModel.save(this.formModel.toJSON());
    }, this);

    this.add_related_model(this.formModel);
    this.add_related_model(this.widgetDefinitionModel);

    this.widgetFormView.bind('change', function () {
      this.commit();
    });
  },

  _onWidgetDefinitionModelChange: function () {
    this.widgetFormView.remove();
    this._generateForm();
    this.render();
  },

  _generateForm: function () {
    this.formModel = WidgetsFormFactory.createWidgetFormModel(this.widgetDefinitionModel.toJSON());

    this.widgetFormView = new Backbone.Form({
      model: this.formModel
    });
    this.addView(this.widgetFormView);

    this._initBinds();
  },

  render: function () {
    this.$el.append(this.widgetFormView.render().$el);
    return this;
  }
});
