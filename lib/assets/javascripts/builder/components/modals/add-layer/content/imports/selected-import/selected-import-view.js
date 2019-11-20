var _ = require('underscore');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var SelectedImportHeaderView = require('./selected-import-header-view');

var REQUIRED_OPTS = [
  'title',
  'name',
  'importView'
];

/**
 *  Selected Import header
 *
 *
 */
module.exports = CoreView.extend({


  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this._initViews();

    return this;
  },

  _initViews: function () {
    var selectedImportHeader = new SelectedImportHeaderView({
      title: this._title,
      name: this._name,
      model: this._uploadModel
    });
    selectedImportHeader.bind('showImportsSelector', this._showImportsSelector, this);
    selectedImportHeader.bind('renderSelectedImportView', this._renderSelectedImportView, this);
    this.$el.append(selectedImportHeader.render().el);
    this.addView(selectedImportHeader);

    this.$el.append(this._importView.render().el);
    this.addView(this._importView);
  },

  _showImportsSelector: function () {
    this.trigger('showImportsSelector', this);
  },

  _renderSelectedImportView: function (importSelected) {
    this.trigger('renderSelectedImportView', importSelected, this);
  }
});
