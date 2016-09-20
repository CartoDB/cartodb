var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./legend-properties-form.tpl');
require('../../../../components/form-components/index');

var DEBOUNCE_TIME = 350;

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.formModel) throw new Error('formModel is required');
    this._formModel = opts.formModel;
    this._onDebouncedChange = _.debounce(this._updateChanges.bind(this), DEBOUNCE_TIME);
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

    this._formView.bind('change', this._onDebouncedChange, this);

    this.$('.js-propertiesForm').append(this._formView.render().el);
  },

  _updateChanges: function () {
    this._formView.commit();
  },

  _removeFormView: function () {
    if (this._formView) {
      this._formView.remove();
    }
  },

  clean: function () {
    this._removeFormView();
    CoreView.prototype.clean.call(this);
  }

});
