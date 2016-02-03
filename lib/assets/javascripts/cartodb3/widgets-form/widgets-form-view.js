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
    this._generateFormView();
    this._initBinds();
  },

  _initBinds: function () {
    this.formModel.bind('change', function () {
      this.widgetDefinitionModel.save(this.formModel.toJSON());
    }, this);

    this.widgetFormView.bind('change', function () {
      this.commit();
    });
  },

  _generateFormView: function () {
    this.widgetFormView = new Backbone.Form({
      model: this.formModel
    });
  },

  _initViews: function () {
    this.$el.append(this.widgetFormView.render().$el);
    this.addView(this.widgetFormView);
  },

  render: function () {
    this._initViews();
    return this;
  }
});
