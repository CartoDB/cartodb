var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./export-image-form.tpl');
require('../../components/form-components/index');
var checkAndBuildOpts = require('../../helpers/required-opts');
var REQUIRED_OPTS = [
  'formModel'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._removeFormView();
    this._renderForm();
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

    this._formView.bind('change', function () {
      this.commit();
    });

    this.$el.append(this._formView.render().$el);
  },

  _updateSchema: function () {
    this._formView.fields.width.setValue(this._formModel.get('width'));
    this._formView.fields.height.setValue(this._formModel.get('height'));
  },

  _initBinds: function () {
    this.listenTo(this._formModel, 'change:width change:height', this._updateSchema);
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
