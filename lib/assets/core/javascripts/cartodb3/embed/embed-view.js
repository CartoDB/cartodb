var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var TabsView = require('./tabs/tabs-view');
var LegendsView = require('./legends/legends-view');
var template = require('./embed.tpl');

var TAB_NAMES = {
  map: 'map',
  legends: 'legends'
};

var MOBILE_VIEWPORT_BREAKPOINT = 1200;

var EmbedView = CoreView.extend({
  className: 'CDB-Embed-view',

  initialize: function (options) {
    this._title = options.title;

    this._tabsModel = new Backbone.Model({
      selected: TAB_NAMES.map
    });

    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      title: this._title
    }));

    var tabsView = new TabsView({
      model: this._tabsModel
    });
    var legendsView = new LegendsView();

    this.$('.js-tabs').replaceWith(tabsView.render().$el);
    this.$('.js-legends').append(legendsView.render().$el);

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._tabsModel, 'change:selected', this._onSelectedTabChanged);

    window.addEventListener('resize', this.onWindowResized.bind(this), { passive: true });
  },

  _onSelectedTabChanged: function () {
    var contentId = '.js-' + this._tabsModel.get('selected');
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
