var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./export-image-widget.tpl');

module.exports = CoreView.extend({
  className: 'ExportImageView',

  events: {
    'mouseenter .js-canvas': '_onEnter',
    'mouseleave .js-canvas': '_onLeave'
  },

  initialize: function (opts) {
    this.model.bind('change:x change:y change:width change:height', this._updateHelpers, this);
    this._initBinds();

    this._mapView = mapView;
  },

  render: function () {
    this.$el.append(template(this.model.attributes));

    this._setupCanvas();
    this._updateHelpers();

    return this;
  },

  _initBinds: function () {
    this._resize = this._onResizeWindow.bind(this);
    $(window).on('keyup', this._resize);
  },

  _onEnter: function () {
    this.$el.addClass('is-top');
  },

  _onLeave: function () {
    this.$el.removeClass('is-top');
  },

  _onResizeWindow: function (e) {
    if (e.target === window) {
      this._updateHelpers();
    }
  },

  _setupCanvas: function () {
    this.$('.js-canvas').resizable({
      resize: this._onResize.bind(this),
      handles: 'n, e, s, w, ne, se, sw, nw',
      containment: $('.CDB-Dashboard-canvas')
    });

    this.$('.js-canvas').draggable({
      drag: this._onDrag.bind(this),
      containment: $('.CDB-Dashboard-canvas')
    });

    this.$('.js-canvas').css({
      top: +this.model.get('x'),
      left: +this.model.get('y'),
      width: +this.model.get('width'),
      height: +this.model.get('height')
    });
  },

  _updateHelpers: function () {
    var x = +this.model.get('x');
    var y = +this.model.get('y');
    var width = +this.model.get('width');
    var height = +this.model.get('height');

    var canvasWidth = this._mapView.$el.width();
    var canvasHeight = this._mapView.$el.height();

    var bottom = y + height + 1;
    var right = x + width + 1;

    this.$('.js-canvas').css({
      top: y,
      left: x,
      height: height,
      width: width
    });

    if (x >= 0 && y >= 0) {
      this.$('.js-helper-north').css({ top: 0, width: right, height: y + 1 });
      this.$('.js-helper-west').css({ left: 0, top: y + 1, width: x + 1, height: height });
      this.$('.js-helper-south').css({ top: bottom, left: 0, width: canvasWidth, height: canvasHeight - height - y });
      this.$('.js-helper-east').css({ left: right, top: 0, width: canvasWidth - width - x - 1, height: bottom });
    }

    if (right + 1 >= canvasWidth) {
      this.$('.js-helper-east').css('width', 0);
    }
    if (x <= 0) {
      this.$('.js-helper-west').css('width', 0);
    }
    if (bottom + 1 >= canvasHeight) {
      this.$('.js-helper-south').css('height', 0);
    }
    if (y <= 0) {
      this.$('.js-helper-north').css('height', 0);
    }
  },

  _onDrag: function () {
    var width = this.$('.js-canvas').width();
    var height = this.$('.js-canvas').height();
    var x = this.$('.js-canvas').position().left;
    var y = this.$('.js-canvas').position().top;

    this._updateCoordinates(x, y, width, height);
  },

  _onResize: function (e, ui) {
    var width = ui.helper.width();
    var height = ui.helper.height();
    var x = ui.helper.position().left;
    var y = ui.helper.position().top;

    this._updateCoordinates(x, y, width, height);
  },

  _updateCoordinates: function (x, y, width, height) {
    var coordinates = this._calcCenter();

    this.model.set({
      x: x,
      y: y,
      width: width,
      height: height,
      lat: coordinates.lat,
      lng: coordinates.lng
    });
  },

  _calcCenter: function () {
    var x = this.model.get('x') + this.model.get('width') / 2;
    var y = this.model.get('y') + this.model.get('height') / 2;

    return this._mapView.containerPointToLatLng({ x: x, y: y });
  },

  open: function () {
    this.$el.show();
  },

  clean: function () {
    this._disableBinds();
    CoreView.prototype.clean.apply(this);
    $(window).off('resize', this._onResizeWindow);
  },

  _disableBinds: function () {
    $(window).off('keyup', this._resize);
  }
});
