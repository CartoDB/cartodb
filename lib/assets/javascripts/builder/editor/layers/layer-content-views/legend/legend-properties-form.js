var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./legend-properties-form.tpl');
require('builder/components/form-components/index');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.formModel) throw new Error('formModel is required');
    this._formModel = opts.formModel;
  },

  render: function () {
    this.clearSubViews();
    this._removeFormView();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initViews: function () {
    this._formView = new Backbone.Form({
      model: this._formModel
    });

    this.listenTo(this._formView, 'change', this._updateChanges, this);

    this.$('.js-propertiesForm').append(this._formView.render().el);

    this.$('form').on('submit', function (event) {
      event.preventDefault();
    });
  },

  _updateChanges: function () {
    this._formView.commit();
  },

  _removeFormView: function () {
    this._formView && this._formView.remove();
  },

  clean: function () {
    this.$('form').off('submit');
    this._removeFormView();
    CoreView.prototype.clean.call(this);
  }

});
