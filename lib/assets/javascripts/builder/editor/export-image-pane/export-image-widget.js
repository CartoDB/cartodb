var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./export-image-widget.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var TRACK_CONTEXT_CLASS = 'track-ImageExport';

var REQUIRED_OPTS = [
  'mapViewClass',
  'dashboardCanvasClass',
  'stateDefinitionModel',
  'mapDefinitionModel'
];

module.exports = CoreView.extend({
  className: 'ExportImageView',

  events: {
    'mouseenter .js-canvas': '_onEnter',
    'mouseleave .js-canvas': '_onLeave'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._$dashBoardCanvas = $('.' + this._dashboardCanvasClass);

    this._initBinds();
  },

  render: function () {
    this.$el.append(template(this.model.attributes));
    this._initViews();

    return this;
  },

  _initViews: function () {
    this._setupCanvas();
    this._updateHelpers();

    var x = +this.model.get('x');
    var y = +this.model.get('y');
    var width = +this.model.get('width');
    var height = +this.model.get('height');

    this._updateCoordinates(x, y, width, height);
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:x change:y change:width change:height', this._updateHelpers);
    this.listenTo(this._stateDefinitionModel, 'change:json', this._onChangeMap);

    this._resize = _.debounce(this._onResizeWindow.bind(this), 20);
    $(window).on('resize', this._resize);

    this.listenTo(this._stateDefinitionModel, 'change', this._updateCanvasCoordinates);
  },

  _onEnter: function () {
    _.debounce(this.$el.addClass('is-top'), 50);
  },

  _onLeave: function () {
    _.debounce(this.$el.removeClass('is-top'), 50);
  },

  _onResizeWindow: function (e) {
    if (e.target === window) {
      var latLngToPixel = this._mapDefinitionModel.latLngToPixel;

      var coordinates = latLngToPixel({
        lat: this.model.get('lat'),
        lng: this.model.get('lng')
      });

      var width = this.model.get('width');
      var height = this.model.get('height');

      this.model.set({
        x: coordinates.x - width / 2,
        y: coordinates.y - height / 2
      });

      this._updateCanvasCoordinates();
      this._updateHelpers();
    }
  },

  _setupCanvas: function () {
    this.$('.js-canvas').resizable({
      resize: this._onResize.bind(this),
      handles: 'n, e, s, w, ne, se, sw, nw',
      containment: this._$dashBoardCanvas
    });

    this.$('.js-canvas').draggable({
      drag: this._updateCanvasCoordinates.bind(this),
      stop: this._updateCanvasCoordinates.bind(this),
      containment: this._$dashBoardCanvas
    });

    this._setupTracks();

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

    var size = this._mapDefinitionModel.getMapViewSize();
    var canvasWidth = size && size.x || 0;
    var canvasHeight = size && size.y || 0;

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

  _updateCanvasCoordinates: function () {
    var width = this.$('.js-canvas').width();
    var height = this.$('.js-canvas').height();
    var x = this.$('.js-canvas').position().left;
    var y = this.$('.js-canvas').position().top;

    this._updateCoordinates(x, y, width, height);
  },

  _onChangeMap: function () {
    var coordinates = this._calcCenter();

    this.model.set({
      lat: coordinates.lat,
      lng: coordinates.lng
    });
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
    var pixelToLatLng = this._mapDefinitionModel.pixelToLatLng;
    return pixelToLatLng({ x: x, y: y });
  },

  _setupTracks: function () {
    this.$('.js-canvas .ui-resizable-nw').addClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeTopLeft');
    this.$('.js-canvas .ui-resizable-n').addClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeTopCenter');
    this.$('.js-canvas .ui-resizable-ne').addClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeTopRight');
    this.$('.js-canvas .ui-resizable-w').addClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeMiddleLeft');
    this.$('.js-canvas .ui-resizable-e').addClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeMiddleCenter');
    this.$('.js-canvas .ui-resizable-sw').addClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeBottomLeft');
    this.$('.js-canvas .ui-resizable-s').addClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeBottomCenter');
    this.$('.js-canvas .ui-resizable-se').addClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeBottomRight');
  },

  clean: function () {
    $(window).off('resize', this._resize);
    CoreView.prototype.clean.apply(this);
  }
});
