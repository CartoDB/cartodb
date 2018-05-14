const _ = require('underscore');
const CoreView = require('backbone/core-view');
const template = require('./organization-icon.tpl');

module.exports = CoreView.extend({
  tagName: 'li',

  className: 'IconList-item IconList-item--small',

  events: {
    'click': '_onClick'
  },

  initialize: function (options) {
    if (_.isUndefined(options.model)) {
      throw new Error('An organization icon model is mandatory.');
    }

    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      url: this.model.get('public_url')
    }));

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:selected', this._onSelectedChanged);
    this.listenTo(this.model, 'change:deleted', this._onDeletedChanged);
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
