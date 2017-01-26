var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  tagName: 'li',

  className: 'IconList-item IconList-item--small',

  events: {
    'click': '_onClick'
  },

  initialize: function (options) {
    if (_.isUndefined(options.model)) {
      throw new Error('An organization icon model is mandatory.');
    }

    this._template = cdb.templates.getTemplate('organization/icon_picker/icons/organization_icon');
    this._initBinds();
  },

  render: function () {
    this.$el.html(this._template({
      url: this.model.get('public_url')
    }));

    return this;
  },

  _initBinds: function () {
    this.model.on('change:selected', this._onSelectedChanged, this);
    this.model.on('change:deleted', this._onDeletedChanged, this);
  },

  _onClick: function () {
    this.model.set('selected', !this.model.get('selected'));
  },

  _onSelectedChanged: function () {
    this.$el.toggleClass('is-selected', this.model.get('selected'));
  },

  _onDeletedChanged: function () {
    if (this.model.get('deleted')) {
      this.$el.remove();
    }
  }
});
