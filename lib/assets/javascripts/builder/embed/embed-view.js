var Backbone = require('backbone');
var _ = require('underscore');
var Ps = require('perfect-scrollbar');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var TabsView = require('./tabs/tabs-view');
var template = require('./embed.tpl');
var EmbedOverlayView = require('./embed-overlay-view');

var TAB_NAMES = {
  map: 'map',
  legends: 'legends'
};

var TAB_TITLES = {
  map: 'map',
  legends: 'legends',
  layers: 'layers'
};

var MOBILE_VIEWPORT_BREAKPOINT = 599;
var FULLSCREEN_VIEWPORT_BREAKPOINT = 1199;

var REQUIRED_OPTS = [
  'title',
  'description',
  'showMenu',
  'showLegends',
  'showLayerSelector'
];

var EmbedView = CoreView.extend({
  module: 'embed:embed-view',

  className: 'CDB-Embed-view',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._onlyLayerSelector = !this._showLegends && this._showLayerSelector;
    this._showLegends = this._showLegends || this._showLayerSelector;

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

    var mapTabConfig = {
      name: TAB_NAMES.map,
      title: TAB_TITLES.map,
      isSelected: true
    };
    var legendTabConfig = {
      name: TAB_NAMES.legends,
      title: this._onlyLayerSelector
        ? TAB_TITLES.layers
        : TAB_NAMES.legends
    };

    if (this._showLegends) {
      var tabsView = new TabsView({
        model: this._tabsModel,
        tabs: [ mapTabConfig, legendTabConfig ]
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

  injectTitle: function (mapEl) {
    var legendsEl = mapEl.find('.CDB-Legends-canvasInner');
    this.$scrollShadowTop = mapEl.find('.CDB-Legends-canvasShadow--top');
    this.$scrollShadowBottom = mapEl.find('.CDB-Legends-canvasShadow--bottom');

    this.titleView = new EmbedOverlayView({
      title: this._title,
      description: this._description,
      showMenu: this._showMenu
    });
    this.addView(this.titleView);
    this.listenTo(this.titleView.model, 'change:collapsed', function (model) {
      // Hack because PS is not triggering events
      if (model.get('collapsed')) {
        this.$scrollShadowTop.removeClass('is-visible');
        this.$scrollShadowBottom.removeClass('is-visible');
        // This is the correct way of doing it, the lines above are a hack, because PS is not triggering events
        legendsEl.scrollTop(0);
        Ps.update(legendsEl.get(0));
      } else {
        // Hack as well, see comment above
        if (legendsEl.get(0).scrollHeight > legendsEl.height()) {
          this.$scrollShadowBottom.addClass('is-visible');
        }
      }
    });

    legendsEl.prepend(this.titleView.render().el);

    legendsEl.find('.CDB-LayerLegends')
      .detach()
      .appendTo(legendsEl.find('.CDB-Overlay-inner'));
  },

  onWindowResized: function () {
    if (window.innerWidth > MOBILE_VIEWPORT_BREAKPOINT && this._tabsModel.get('selected') !== TAB_NAMES.map) {
      this._tabsModel.set({ selected: TAB_NAMES.map });
    }

    if (this.titleView && window.innerWidth > FULLSCREEN_VIEWPORT_BREAKPOINT) {
      this.titleView.model.set('collapsed', false);
    }
  }
});

module.exports = EmbedView;
