var cdb = require('cartodb.js');
var $ = require('jquery');
var WidgetFormFactory = require('../widgets-form-factory');
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
    if (!this.options.type) {
      throw new Error('A form type [style or data] should be provided');
    }

    this.formType = this.options.type;
    this.widgetDefinitionModel = this.options.widgetDefinitionModel;
    this._generateForm();
  },

  _generateForm: function () {
    this.widgetFormModel = WidgetFormFactory.createWidgetFormModel(this.formType, this.widgetDefinitionModel);

    this.widgetFormView = new Backbone.Form({
      model: this.widgetFormModel
    });

    this.widgetFormModel.bind('change', function () {
      this.widgetFormModel.updateDefinitionModel();
    }, this);

    this.widgetFormModel.bind('changeSchema', function () {
      this.render();
    }, this);

    this.widgetFormView.bind('change', function () {
      var errors = this.commit();
      console.log('errors', errors);
    });
  },

  render: function () {
    this.$el.html(this.widgetFormView.render().$el);
    return this;
  },

  clean: function () {
    // Backbone.Form removes the view with the following method
    this.widgetFormView.remove();
    cdb.core.View.prototype.clean.call(this);
  }
});
