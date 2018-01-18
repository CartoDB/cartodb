var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../helpers/required-opts');
var TabsView = require('./tabs/tabs-view');
var template = require('./embed.tpl');

var TAB_NAMES = {
  map: 'map',
  legends: 'legends'
};

var MOBILE_VIEWPORT_BREAKPOINT = 759;

var REQUIRED_OPTS = [
  'title',
  'showMenu',
  'showLegends'
];

var EmbedView = CoreView.extend({
  className: 'CDB-Embed-view',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    if (this._showLegends) {
      this._tabsModel = new Backbone.Model({
        selected: TAB_NAMES.map
      });

      this._initBinds();
    }
  },

  render: function () {
    this.$el.html(template({
      title: this._title,
      showMenu: this._showMenu
    }));

    if (this._showLegends) {
      var tabsView = new TabsView({
        model: this._tabsModel
      });

      this.$('.js-tabs').replaceWith(tabsView.render().$el);
    }

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._tabsModel, 'change:selected', this._onSelectedTabChanged);

    window.addEventListener('resize', this.onWindowResized.bind(this), { passive: true });
  },

  _onSelectedTabChanged: function () {
    var contentId = '.js-embed-' + this._tabsModel.get('selected');
    var content = this.$(contentId);

    content.siblings().hide();
    content.show();
  },

  onWindowResized: function (event) {
    if (window.innerWidth > MOBILE_VIEWPORT_BREAKPOINT && this._tabsModel.get('selected') !== TAB_NAMES.map) {
      this._tabsModel.set({ selected: TAB_NAMES.map });
    }
  }
});

module.exports = EmbedView;
