var Backbone = require('backbone');
var _ = require('underscore');
var Ps = require('perfect-scrollbar');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var TabsView = require('./tabs/tabs-view');
var template = require('./embed.tpl');
var EmbedOverlay = require('./embed-overlay-view');
var embedTitle = require('./embed-title.tpl');

var TAB_NAMES = {
  map: 'map',
  legends: 'legends'
};

var MOBILE_VIEWPORT_BREAKPOINT = 759;

var REQUIRED_OPTS = [
  'title',
  'description',
  'showMenu',
  'showLegends'
];

var EmbedView = CoreView.extend({
  className: 'CDB-Embed-view',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    if (this._showLegends) {
      var selectedTab = _.find(this._tabs, function (tab) { return tab.isSelected; });

      this._tabsModel = new Backbone.Model({
        selected: selectedTab ? selectedTab.name : TAB_NAMES.map
      });

      this._initBinds();
    }
  },

  render: function () {
    this.$el.html(template({
      title: this._title,
      description: this._description,
      showMenu: this._showMenu,
      showLegends: this._showLegends
    }));

    if (this._showLegends) {
      var tabsView = new TabsView({
        model: this._tabsModel,
        tabs: [
          { name: 'map', isSelected: true },
          { name: 'legends' }
        ]
      });
      this.addView(tabsView);

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

    content.siblings().removeClass('is-active');
    content.addClass('is-active');

    // Update PerfectScrollbar
    var perfectScrollbarContainer = content.find('.ps-container').get(0);
    if (perfectScrollbarContainer) {
      Ps.update(perfectScrollbarContainer);
    }
  },

  injectTitle: function (legendsEl) {
    var opts = {
      title: this._title,
      description: this._description
    };

    if (legendsEl.is(':visible')) {
      legendsEl.prepend(embedTitle(opts));
    } else {
      var embedOverlay = new EmbedOverlay(opts);
      this.addView(embedOverlay);

      this.$('.js-embed-map').append(embedOverlay.render().el);
    }
  },

  onWindowResized: function () {
    if (window.innerWidth > MOBILE_VIEWPORT_BREAKPOINT && this._tabsModel.get('selected') !== TAB_NAMES.map) {
      this._tabsModel.set({ selected: TAB_NAMES.map });
    }
  }
});

module.exports = EmbedView;
