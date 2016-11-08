var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-geometry-form.tpl');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.featureModel) throw new Error('featureModel is required');
    if (!opts.formModel) throw new Error('formModel is required');

    this._featureModel = opts.featureModel;
    this._formModel = opts.formModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._generateForms();

    return this;
  },

  _generateForms: function () {
    var self = this;

    if (this._formView) {
      this._formView.remove();
    }

    this._formView = new Backbone.Form({
      model: this._formModel
    });

    this._formView.bind('change', function () {
      var validate = this.validate();
      self._formModel.trigger('validate', !!validate);

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
