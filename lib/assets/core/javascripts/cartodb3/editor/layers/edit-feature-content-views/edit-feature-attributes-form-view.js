var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-attributes-form.tpl');

module.exports = CoreView.extend({
  module: 'editor:layers:edit-feature-content-views:edit-feature-attributes-form-view',

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._generateForms();

    this.model.bind('changeSchema', this._generateForms, this);

    return this;
  },

  _generateForms: function () {
    var self = this;

    if (this._formView) {
      this._formView.remove();
    }

    this._formView = new Backbone.Form({
      model: this.model
    });

    this._formView.bind('change', function () {
      var validate = this.validate();
      self.model.trigger('validate', !!validate);

      if (!validate) {
        this.commit();
      }
    });

    this.$('.js-form').append(this._formView.render().$el);
  },

  clean: function () {
    if (this._formView) {
      this._formView.remove();
    }
  }

});
