var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-geometry-form.tpl');

module.exports = CoreView.extend({

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

    this._formView = new Backbone.Form({
      model: this.model
    });

    this._formView.bind('change', this._validateForm, this);

    this.model.bind('updateFeature', function (attrs) {
      _.each(attrs, function (value, key) {
        this._formView.fields[key].editor.setValue(value);
      }, this);
      this._validateForm();
    }, this);

    this.$('.js-form').append(this._formView.render().$el);
  },

  _validateForm: function () {
    var validate = this._formView.validate();
    this.model.trigger('validate', !!validate);

    if (!validate) {
      this._formView.commit();
    }
  },

  clean: function () {
    if (this._formView) {
      this._formView.remove();
    }
  }

});
