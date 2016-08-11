/* global Image */

var CoreView = require('backbone/core-view');
var template = require('./mosaic-item.tpl');

var DEFAULT_SUBDOMAIN = 'a';
var DEFAULT_X_POSITION = 30;
var DEFAULT_Y_POSISTION = 24;
var DEFAULT_ZOOM = 6;
var DEFAULT_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoAQAAAACkhYXAAAAAAnRSTlMAAHaTzTgAAAALSURBVHgBYxhhAAAA8AAB4rh1IgAAAABJRU5ErkJggg==';
var DEFAULT_NAME = _t('editor.layers.basemap.custom-basemap');

module.exports = CoreView.extend({

  className: 'Mosaic-item',

  tagName: 'li',

  events: {
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

  _initBinds: function () {
    this.model.bind('change:selected', this.render, this);
  },

  _onMouseEnter: function () {
    this.model.set('highlighted', true);
  },

  _onMouseLeave: function () {
    this.model.set('highlighted', false);
  },

  _onClick: function () {
    if (this._disabled) {
      return false;
    }

    this.model.set('selected', true);
  }

});
