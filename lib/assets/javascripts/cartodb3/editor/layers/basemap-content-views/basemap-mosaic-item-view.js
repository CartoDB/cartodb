/* global Image */

var template = require('./basemap-mosaic-item.tpl');
var MosaicItemView = require('../../../components/mosaic/mosaic-item-view');
var CustomListCollection = require('../../../components/custom-list/custom-list-collection');
var ContextMenuView = require('../../../components/context-menu/context-menu-view');

var DEFAULT_SUBDOMAIN = 'a';
var DEFAULT_X_POSITION = 30;
var DEFAULT_Y_POSISTION = 24;
var DEFAULT_ZOOM = 6;
var DEFAULT_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAAZ9JREFUWAntWUtugzAUNKbAJl1EYtcz9Ba5UE6SC+UWPUN3SNlkw78zVhJRCeIXbCup6ic5gP08Ho/x40ESBauq6iNJkgPKDpdb1j3RTuM4HlH2ZVl+JySXpukXygaksiViRVEsNd3qu65Tfd/frpdO8jxXEGO2GcTUMAxtXddnYH1qKqe1fof3IrlZpECVJA6xMgiyMdzws0N5CzTealiIlpGbBsKz77nZSYAc67ck+NIWCbouj1cFL/eNK6df/UW7FztKMT7ZTOJDDMQ5RUyJGYK2IMyBm6ax4nFQGxZBEIStWFcH2TSu3pZjiCX2StDCf1VzJLhKtkmnqOBEjFWn/0tBaaB+REoTqJkJ2wxJpM3FtPvGMgQlabrkCUEcCcF7Kf9UBT5xvN6DIZbYK8Hp7H2dR4KuSkYFo4KPKBAiYTWBmoHznvEdQpKm82ljw+I4DObElJghaJu59AWHA9qw6CMlR9+4i6mCi0UFXdRj3z+hIL8Ju040VP+TBrkjtn0bagQH3JbcSHB/+WDNCgc8r11bZOdncjPfWV/5b4gfOaaYLUG/QVoAAAAASUVORK5CYII=';
var DEFAULT_NAME = _t('editor.layers.basemap.custom-basemap');

module.exports = MosaicItemView.extend({

  events: {
    'click .js-Mosaic-remove': '_onToggleContextMenuClicked',
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave',
    'click': '_onClick'
  },

  initialize: function (opts) {
    this._disabled = opts.disabled;

    this._initBinds();
  },

  render: function () {
    this.$el.html(
      template({
        name: this._getName(),
        template: this.model.get('template')(this._getImageURL())
      })
    );
    this.$el.addClass('js-' + this.model.getValue());
    this.$el.toggleClass('is-selected', !!this.model.get('selected'));
    return this;
  },

  _getImageURL: function () {
    var self = this;
    var url = this._lowerXYZ();

    var image = new Image();
    image.onerror = function () {
      self.$('.js-thumbnailImg').attr('src', DEFAULT_IMG);
    };
    image.src = url;

    return url;
  },

  _getSubdomain: function () {
    var subdomains = this.model.get('subdomains'); // eg: 'abcd' or '1234'

    return (subdomains && subdomains.length) ? subdomains[0] : DEFAULT_SUBDOMAIN;
  },

  _lowerXYZ: function () {
    return this.model.get('urlTemplate')
      .replace('{s}', this._getSubdomain())
      .replace('{z}', DEFAULT_ZOOM)
      .replace('{x}', DEFAULT_X_POSITION)
      .replace('{y}', DEFAULT_Y_POSISTION);
  },

  _getName: function () {
    var name = this.model.getName();

    if (!name) {
      name = this.model.get('order') ? DEFAULT_NAME + ' ' + this.model.get('order') : DEFAULT_NAME;
    } else {
      name.replace(/_/g, '');
    }

    return name;
  },

  _hasContextMenu: function () {
    return this._menuView;
  },

  _hideContextMenu: function () {
    this._menuView.remove();
    this.removeView(this._menuView);
    delete this._menuView;
  },

  _showContextMenu: function (position) {
    var menuItems = new CustomListCollection([{
      label: 'Remove baselayer',
      val: 'remove-baselayer',
      destructive: true
    }]);

    var triggerElementID = 'context-menu-trigger-' + this.model.cid;
    this.$('.js-Mosaic-remove').attr('id', triggerElementID);
    this._menuView = new ContextMenuView({
      collection: menuItems,
      triggerElementID: triggerElementID,
      position: position
    });

    menuItems.bind('change:selected', function (menuItem) {
      if (menuItem.get('val') === 'remove-baselayer') {
        this._deleteBaselayer();
      }
    }, this);

    this._menuView.model.bind('change:visible', function (model, isContextMenuVisible) {
      if (this._hasContextMenu() && !isContextMenuVisible) {
        this._hideContextMenu();
      }
    }, this);

    this._menuView.show();
    this.addView(this._menuView);
  },

  _deleteBaselayer: function () {
    console.log('olakase');
  },

  _onToggleContextMenuClicked: function (e) {
    if (this._hasContextMenu()) {
      this._hideContextMenu();
    } else {
      this._showContextMenu({
        x: e.pageX,
        y: e.pageY
      });
    }
  }

});
