var cdb = require('cartodb.js');
var _ = require('underscore');
var template = require('./editor-header.tpl');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.title) throw new Error('title is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    this._title = opts.title;
    this._editorModel = opts.editorModel;
    _.bind(this._changeStyle, this);
    this._bindEvents();
  },

  render: function () {
    this.$el.html(
      template({
        title: this._title
      })
    );
    return this;
  },

  _bindEvents: function () {
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);
  },

  _changeStyle: function (m) {
    this._getTitle().toggleClass('is-dark', m.isEditing());
  },

  _getTitle: function () {
    return this.$('.Editor-HeaderInfo');
  }
});
