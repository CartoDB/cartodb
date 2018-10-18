const CoreView = require('backbone/core-view');
const template = require('./group-user.tpl');
const pluralizeStr = require('dashboard/helpers/pluralize');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'model'
];

/**
 * View of a single group user.
 */
module.exports = CoreView.extend({
  tagName: 'li',
  className: 'OrganizationList-user is-selectable',
  events: {
    'click': '_onClick'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:selected', this._onChangeSelected);
  },

  render: function () {
    this.$el.html(
      template({
        avatarUrl: this.model.get('avatar_url'),
        username: this.model.get('username'),
        email: this.model.get('email'),
        maps_count: pluralizeStr.prefixWithCount('map', 'maps', this.model.get('all_visualization_count')),
        table_count: pluralizeStr.prefixWithCount('dataset', 'datasets', this.model.get('table_count'))
      })
    );

    return this;
  },

  _onChangeSelected: function (model, isSelected) {
    this.$el.toggleClass('is-selected', !!isSelected);
  },

  _onClick: function (ev) {
    this.killEvent(ev);
    this.model.set('selected', !this.model.get('selected'));
  }

});
