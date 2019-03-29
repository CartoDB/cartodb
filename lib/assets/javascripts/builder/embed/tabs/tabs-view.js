var CoreView = require('backbone/core-view');
var template = require('./tabs.tpl');
var tabItemTemplate = require('./tab-item.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'tabs'
];

var TabsView = CoreView.extend({
  module: 'embed:tabs:tabs-view',

  tagName: 'nav',

  className: 'CDB-Embed-tabs CDB-NavMenu js-tabs',

  events: {
    'click .js-tab': '_onTabClicked'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.listenTo(this.model, 'change:selected', this._onSelectedTabChanged);
  },

  render: function () {
    this.$el.empty();

    this.$el.html(template());

    this._tabs.map(function (tab) {
      this.$('.js-tabs-container').append(tabItemTemplate({
        name: tab.name,
        title: tab.title || tab.name,
        isSelected: tab.isSelected
      }));
    }.bind(this));

    return this;
  },

  _onSelectedTabChanged: function () {
    var tabName = this.model.get('selected');
    var tab = this.$('[data-tab="' + tabName + '"]');

    tab.siblings().removeClass('is-selected');
    tab.addClass('is-selected');
  },

  _onTabClicked: function (event) {
    var tab = this.$(event.currentTarget);
    var tabName = tab.data('tab');

    this.model.set({
      selected: tabName
    });
  }
});

module.exports = TabsView;
