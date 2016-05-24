var cdb = require('cartodb.js');
var _ = require('underscore');
var template = require('./layer-header.tpl');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;

    this._editorModel = opts.editorModel;
    _.bind(this._changeStyle, this);
    this._bindEvents();
  },

  render: function () {
    this.$el.html(
      template({
        title: this.layerDefinitionModel.getName(),
        alias: this.layerDefinitionModel.getTableName().replace(/_/gi, ' ')
      })
    );
    return this;
  },

  _bindEvents: function () {
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);
  },

  _changeStyle: function (m) {
    m.isEditing() === true
      ? this._darken()
      : this._lighten();
  },

  _darken: function () {
    this._getTitle()
        .addClass('is-dark')
        .removeClass('is-light');
  },

  _lighten: function () {
    this._getTitle()
        .addClass('is-light')
        .removeClass('is-dark');
  },

  _getTitle: function () {
    return this.$('.Editor-HeaderInfo');
  }
});
