var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-attributes-form.tpl');
var EditFeatureAttributesFormModel = require('./edit-feature-attributes-form-model');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');

    this._columnsCollection = opts.columnsCollection;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._generateForms();

    return this;
  },

  _generateForms: function () {
    if (this._formView) {
      this._formView.remove();
    }

    this._formModel = new EditFeatureAttributesFormModel(this.model.toJSON(), {
      featureModel: this.model,
      columnsCollection: this._columnsCollection
    });

    this._formView = new Backbone.Form({
      model: this._formModel
    });

    this._formView.bind('change', function () {
      this.commit();
    });

    this.$('.js-form').append(this._formView.render().$el);
  },

  clean: function () {
    if (this._formView) {
      this._formView.remove();
    }
  }

});
