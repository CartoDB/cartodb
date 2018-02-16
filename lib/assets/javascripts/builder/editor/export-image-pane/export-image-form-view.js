var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./export-image-form.tpl');
require('builder/components/form-components/index');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var REQUIRED_OPTS = [
  'formModel'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();
    this._removeFormView();
    this._renderForm();
    this._initBinds();
    return this;
  },

  _renderForm: function () {
    this.clearSubViews();
    this._removeFormView();

    this._formView = new Backbone.Form({
      template: template,
      model: this._formModel
    });

    this.$('form').on('submit', function (e) {
      e.preventDefault();
    });

    this.$el.append(this._formView.render().$el);
  },

  _initBinds: function () {
    this.listenTo(this._formView, 'change', this._updateChanges);
    this.listenTo(this._formModel, 'change:width change:height', this._updateSchema);
  },

  _updateSchema: function () {
    this._formView.fields.width.setValue(this._formModel.get('width'));
    this._formView.fields.height.setValue(this._formModel.get('height'));
    this._updateChanges();
  },

  _updateChanges: function () {
    var errors = this._formView.commit({validate: true});
    this._formView.model.setErrors(errors);
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
