var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./legend-properties-form.tpl');
require('../../../../components/form-components/index');

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

    this._formView.on('change', this._updateChanges, this);
    this.add_related_model(this._formView);

    this.$('.js-propertiesForm').append(this._formView.render().el);

    this.$('form').on('submit', function (e) {
      e.preventDefault();
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
