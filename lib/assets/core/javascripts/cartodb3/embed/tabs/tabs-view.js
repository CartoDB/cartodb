var CoreView = require('backbone/core-view');
var template = require('./tabs.tpl');

var TabsView = CoreView.extend({
  tagName: 'nav',

  className: 'CDB-Embed-tabs CDB-NavMenu',

  events: {
    'click .js-tab': '_onTabClicked'
  },

  initialize: function () {
    this.listenTo(this.model, 'change:selected', this._onSelectedTabChanged);
  },

  render: function () {
    this.$el.html(template());

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
