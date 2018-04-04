var _ = require('underscore');
var $ = require('jquery');
var Ps = require('perfect-scrollbar');
var CoreView = require('backbone/core-view');
var infowindowDefaultTemplate = require('./templates/infowindow-template.tpl');

var ESC_KEY = 27;

var Infowindow = CoreView.extend({
  options: {
    imageTransitionSpeed: 300,
    hookMargin: 24,
    hookHeight: 16
  },

  className: 'CDB-infowindow-wrapper INFOWINDOW-NEW', // FIXME

  events: {
    'click .js-close': '_closeInfowindow',
    'click .close': '_closeInfowindow',
    'touchstart .js-close': '_closeInfowindow',
    'MSPointerDown .js-close': '_closeInfowindow',
    'dragstart': '_stopPropagation',
    'mousedown': '_stopPropagation',
    'pointerdown': '_stopPropagation',
    'touchstart': '_stopPropagation',
    'MSPointerDown': '_stopPropagation',
    'dblclick': '_stopPropagation',
    'DOMMouseScroll': 'killEvent',
    'MozMousePixelScroll': 'killEvent',
    'mousewheel': 'killEvent',
    'dbclick': '_stopPropagation',
    'click': '_stopPropagation'
  },

  initialize: function () {
    this._initBinds();
    this.render();
    this.$el.hide();
  },

  _initBinds: function () {
    _.bindAll(this, '_onKeyUp', '_onLoadImageSuccess', '_onLoadImageError');

    this.listenTo(this.model, 'change:content change:alternative_names change:width change:maxHeight', this.render, this);
    this.listenTo(this.model, 'change:latlng', this._update, this);
    this.listenTo(this.model, 'change:visibility', this.toggle, this);
    // this.listenTo(this.model, 'change:template change:sanitizeTemplate', this._compileTemplate, this);
    this.listenTo(this.model, 'change:template', this._updateTemplate, this);
    // this.listenTo(this._mapView.map, 'change', this._updatePosition, this);
    this.listenTo(this.model, 'onUpdatePosition', this._updatePosition, this);

    // this.listenTo(this._mapView, 'zoomstart', function () {
    //   this.hide(true);
    // });
    //
    // this.listenTo(this._mapView, 'zoomend', function () {
    //   this.show();
    // });
  },

  _updateTemplate: function () {
    this.render();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var infowindowTemplate = this.model.get('template');

    this.$el.html(
      infowindowTemplate({
        title: 'Title',
        subtitle: 'Subtitle'
      })
    );

    // var fields = _.map(this.model.attributes.content.fields, function (field) {
    //   return _.clone(field);
    // });

    // var data = this.model.get('content') ? this.model.get('content').data : {};

    // Sanitized fields
    // fields = _.map(fields, this._sanitizeField, this);

    // Join plan fields values with content to work with
    // custom infowindows and CartoDB infowindows.
    // var values = {};
    //
    // _.each(fields, function (pair) {
    //   values[pair.name] = pair.value;
    // });
    //
    // var obj = _.extend({
    //   content: {
    //     fields: fields,
    //     data: data
    //   }
    // }, values);

    // Set width and max-height from the model only
    // If there is no width set, we don't force our infowindow
    // if (this.model.get('width')) {
    this.$('.js-infowindow').css('width', '100' + 'px');
    // }

    // if (this.model.get('maxHeight')) {
    this._getContent().css('max-height', '200' + 'px');
    // }

    // if (this._containsCover()) {
    //   this._loadCover();
    // }
    //
    // this._setupClasses();
    // this._renderScroll();
    // this._renderShadows();
    // this._bindScroll();

    return this;
  },

  // migration issue: some infowindows doesn't have this selector
  _getContent: function () {
    var $el = this.$('.js-content');
    if ($el.length === 0) {
      $el = this.$('.cartodb-popup-content');
    }

    return $el;
  },

  _onKeyUp: function (event) {
    if (event && event.keyCode === ESC_KEY) {
      this._closeInfowindow();
    }
  },
  //
  // _setupClasses: function () {
  //   var $infowindow = this.$('.js-infowindow');
  //   var hasHeader = this.$('.js-header').length;
  //   var hasCover = this.$('.js-cover').length;
  //   var hasContent = this._getContent().length;
  //   var hasTitle = this.$('.CDB-infowindow-title').length;
  //   var numberOfFields = this.model.get('content') && this.model.get('content').fields.length;
  //
  //   if (hasCover) {
  //     $infowindow
  //       .addClass('has-header-image')
  //       .toggleClass('no-content', numberOfFields < 3);
  //   }
  //
  //   if (hasHeader) {
  //     $infowindow.addClass('has-header');
  //   }
  //
  //   if (hasContent) {
  //     $infowindow.addClass('has-fields');
  //   }
  //
  //   if (hasTitle) {
  //     $infowindow.addClass('has-title');
  //   }
  // },
  //
  // _renderScroll: function () {
  //   if (this._getContent().length === 0) {
  //     return;
  //   }
  //
  //   this._content = this._getContent().get(0);
  //   this.$('.js-infowindow').addClass('has-scroll');
  //
  //   Ps.initialize(this._content, {
  //     wheelSpeed: 1,
  //     wheelPropagation: true,
  //     minScrollbarLength: 20
  //   });
  // },
  //
  // _renderShadows: function () {
  //   this.$shadowTop = $('<div>').addClass('CDB-infowindow-canvasShadow CDB-infowindow-canvasShadow--top');
  //   this.$shadowBottom = $('<div>').addClass('CDB-infowindow-canvasShadow CDB-infowindow-canvasShadow--bottom');
  //   var $inner = this.$('.js-inner');
  //   $inner.append(this.$shadowTop);
  //   $inner.append(this.$shadowBottom);
  //   _.defer(function () {
  //     this._showOrHideShadows();
  //   }.bind(this));
  // },
  //
  // _bindScroll: function () {
  //   this.$(this._content)
  //     .on('ps-y-reach-start', _.bind(this._onScrollTop, this))
  //     .on('ps-y-reach-end', _.bind(this._onScrollBottom, this))
  //     .on('ps-scroll-y', _.bind(this._onScroll, this));
  // },
  //
  // _onScrollTop: function () {
  //   this.$shadowTop.removeClass('is-visible');
  // },
  //
  // _onScroll: function () {
  //   this._showOrHideShadows();
  // },
  //
  // _showOrHideShadows: function () {
  //   var $el = $(this._content);
  //   if ($el.length) {
  //     var currentPos = $el.scrollTop();
  //     var max = $el.get(0).scrollHeight;
  //     var height = $el.outerHeight();
  //     var maxPos = max - height;
  //
  //     this.$shadowTop.toggleClass('is-visible', currentPos > 0);
  //     this.$shadowBottom.toggleClass('is-visible', currentPos < maxPos);
  //   }
  // },
  //
  // _onScrollBottom: function () {
  //   this.$shadowBottom.removeClass('is-visible');
  // },
  //
  // _container: function () {
  //   return this.el.querySelector('.js-container');
  // },
  //
  // /**
  //  *  Compile template of the infowindow
  //  */

  //
  // _sanitizeValue: function (key, val) {
  //   if (_.isObject(val)) {
  //     return val;
  //   }
  //
  //   return String(val);
  // },
  //
  // _sanitizeField: function (attr) {
  //   // Check null or undefined :| and set both to empty == ''
  //   if (attr.value === null || attr.value === undefined) {
  //     attr.value = '';
  //   }
  //
  //   // Get the alternative name
  //   var alternativeName = this.model.getAlternativeName(attr.name);
  //   attr.title = (attr.title && alternativeName) ? alternativeName : attr.title;
  //
  //   // Save new sanitized value
  //   attr.value = JSON.parse(JSON.stringify(attr.value), this._sanitizeValue);
  //
  //   return attr;
  // },
  //
  // /**
  //  *  Does header contain cover?
  //  */
  // _containsCover: function () {
  //   return !!this.$('.js-infowindow').attr('data-cover');
  // },
  //
  // _containsTemplateCover: function () {
  //   return this.$('.js-cover img').length > 0;
  // },
  //
  // _getCoverURL: function () {
  //   var content = this.model.get('content');
  //   var imageSRC = this.$('.js-cover img').attr('src');
  //
  //   if (imageSRC) {
  //     return imageSRC;
  //   }
  //
  //   if (content && content.fields && content.fields.length > 0) {
  //     return (content.fields[0].value || '').toString();
  //   }
  //
  //   return false;
  // },
  //
  // _loadImageHook: function (imageDimensions, coverDimensions, url) {
  //   var $hook = this.$('.CDB-hook');
  //
  //   if (!$hook) {
  //     return;
  //   }
  //
  //   var $hookImage = $('<img />')
  //     .addClass('CDB-hookImage js-hookImage')
  //     .attr('src', url);
  //
  //   $hook.append($hookImage);
  //
  //   $hookImage.css({
  //     marginTop: -(imageDimensions.height - this.options.hookHeight),
  //     width: coverDimensions.width,
  //     display: 'none'
  //   });
  //
  //   $hookImage.load(
  //     function () {
  //       $hook.parent().addClass('has-image');
  //       $hookImage.clipPath(this._getHookPoints(imageDimensions.height - this.options.hookHeight));
  //       $hookImage.show();
  //     }.bind(this)
  //   );
  // },
  //
  // _getHookPoints: function (imageHeight) {
  //   return [
  //     [24, imageHeight],
  //     [24, imageHeight + 16],
  //     [48, imageHeight],
  //     [24, imageHeight]
  //   ];
  // },
  //
  // _loadCoverFromTemplate: function (url) {
  //   this.$('.js-cover img').remove();
  //   this._loadCoverFromUrl(url);
  // },
  //
  // _loadCoverFromUrl: function (url) {
  //   var $cover = this.$('.js-cover');
  //
  //   this._startCoverLoader();
  //
  //   var $img = $("<img class='CDB-infowindow-media-item' />");
  //   $cover.append($img);
  //
  //   $img
  //     .load(this._onLoadImageSuccess)
  //     .error(this._onLoadImageError)
  //     .attr('src', url);
  // },
  //
  _onLoadImageError: function () {
    this._stopCoverLoader();
    this._showInfowindowImageError();
  },

  _onLoadImageSuccess: function () {
    var $cover = this.$('.js-cover');
    var $img = this.$('.CDB-infowindow-media-item');
    var url = $img.attr('src');
    var numFields = this.model.get('content').fields.length;

    var imageDimensions = { width: $img.width(), height: $img.height() };
    var coverDimensions = { width: $cover.width(), height: $cover.height() };

    var styles = this._calcImageStyle(imageDimensions, coverDimensions);

    $img.css(styles);

    $cover.css({ height: imageDimensions.height - this.options.hookHeight });

    this._stopCoverLoader();

    $img.fadeIn(150);

    if (numFields < 3 && imageDimensions.height >= this.$el.height()) {
      this._loadImageHook(imageDimensions, coverDimensions, url);
    }
  },

  _calcImageStyle: function (imageDimensions, coverDimensions) {
    var styles = {};

    var imageRatio = imageDimensions.height / imageDimensions.width;
    var coverRatio = coverDimensions.height / coverDimensions.width;

    if (imageDimensions.width > coverDimensions.width && imageDimensions.height > coverDimensions.height) {
      if (imageRatio < coverRatio) {
        styles = { height: coverDimensions.height };
      }
    } else {
      styles = { width: imageDimensions.width };
    }

    return styles;
  },

  _loadCover: function () {
    this._renderCoverLoader();
    this._startCoverLoader();

    var url = this._getCoverURL();

    if (this._isLoadingFields()) {
      return;
    }

    if (!this._isValidURL(url)) {
      this._stopCoverLoader();
      this._showInfowindowImageError();
      return;
    }

    if (this._containsTemplateCover()) {
      this._loadCoverFromTemplate(url);
    } else {
      this._loadCoverFromUrl(url);
    }
  },

  _isLoadingFields: function () {
    var content = this.model.get('content');
    return !content || (content.fields.length === 1 && content.fields[0].type === 'loading');
  },

  _renderCoverLoader: function () {
    var $loader = $('<div>').addClass('CDB-Loader js-loader');

    if (this.$('.js-cover').length > 0) {
      this.$('.js-cover').append($loader);
    }
  },

  _startCoverLoader: function () {
    this.$('.js-infowindow').addClass('is-loading');
    this.$('.js-loader').addClass('is-visible');
  },

  _clearInfowindowImageError: function () {
    this.$('.js-infowindow').removeClass('is-fail');
  },

  _showInfowindowImageError: function () {
    this.$('.js-infowindow').addClass('is-fail');
    this.$('.js-cover').append('<p class="CDB-infowindow-fail">Non-valid picture URL</p>');
  },

  _stopCoverLoader: function () {
    this.$('.js-infowindow').removeClass('is-loading');
    this.$('.js-loader').removeClass('is-visible');
  },

  /**
   *  Return true if the provided URL is valid
   */
  _isValidURL: function (url) {
    if (url) {
      var urlPattern = /^(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-|]*[\w@?^=%&amp;\/~+#-])?$/;
      return String(url).match(urlPattern) !== null;
    }

    return false;
  },

  toggle: function () {
    var ADJUST_ON_SHOW = true;
    var FORCE_ON_CLOSE = false;

    this.model.get('visibility')
      ? this.show(ADJUST_ON_SHOW)
      : this.hide(FORCE_ON_CLOSE);
  },

  _stopPropagation: function (ev) {
    ev.stopPropagation();
  },

  _closeInfowindow: function (ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
    }
    if (this.model.get('visibility')) {
      this.model.set('visibility', false);
    }
  },

  show: function (adjustPan) {
    $(document)
      .off('keyup', this._onKeyUp)
      .on('keyup', this._onKeyUp);

    if (this.model.get('visibility')) {
      this._update(adjustPan);
    }
  },

  isHidden: function () {
    return !this.model.get('visibility');
  },

  hide: function (force) {
    $(document).off('keyup', this._onKeyUp);
    if (force || !this.model.get('visibility')) this._animateOut();
  },

  // _updateAndAdjustPan: function () {
  //   this._update(true);
  // },
  //
  /**
   *  Update infowindow
   */
  _update: function () {
    if (!this.isHidden()) {
      var delay = 0;

      // if (adjustPan) {
      //   delay = this.adjustPan();
      // }

      this._updatePosition();
      this._animateIn(delay);
    }
  },
  //
  // /**
  //  *  Animate infowindow to show up
  //  */
  _animateIn: function (delay) {
    // if (!util.ie || (util.browser.ie && util.browser.ie.version > 8)) {
    this.$el.css({
      'marginBottom': '-10px',
      'display': 'block',
      'visibility': 'visible',
      opacity: 0
    });

    this.$el
      .delay(delay)
      .animate({
        opacity: 1,
        marginBottom: 0
      }, 300); // FIXME magic number
    // } else {
    // this.$el.show();
    // }
  },

  _animateOut: function () {
    // if (!util.ie || (util.browser.ie && util.browser.ie.version > 8)) {
    var self = this;
    this.$el.animate({
      marginBottom: '-10px',
      opacity: '0',
      display: 'block'
    }, 180, function () {
      self.$el.css({visibility: 'hidden'});
    });
    // } else {
    //   this.$el.hide();
    // }
  },

  // adjustPan: function () {
  //   var offset = this.model.get('offset');
  //
  //   if (!this.model.get('autoPan') || this.isHidden()) { return; }
  //
  //   var containerHeight = this.$el.outerHeight(true) + this.options.hookHeight;
  //   var containerWidth = this.$el.width();
  //   var pos = this.model.get('pos');
  //   var adjustOffset = {x: 0, y: 0};
  //   var size = this.model.get('size');
  //   var waitCallback = 0;
  //
  //   if (pos.x - offset[0] < 0) {
  //     adjustOffset.x = pos.x - offset[0] - 10;
  //   }
  //
  //   if (pos.x - offset[0] + containerWidth > size.x) {
  //     adjustOffset.x = pos.x + containerWidth - size.x - offset[0] + 10;
  //   }
  //
  //   if (pos.y - containerHeight < 0) {
  //     adjustOffset.y = pos.y - containerHeight - 10;
  //   }
  //
  //   if (pos.y - containerHeight > size.y) {
  //     adjustOffset.y = pos.y + containerHeight - size.y;
  //   }
  //
  //   if (adjustOffset.x || adjustOffset.y) {
  //     this.model.get('map').panBy(adjustOffset);
  //     waitCallback = 300;
  //   }
  //
  //   return waitCallback;
  // },

  _updatePosition: function () {
    if (this.isHidden()) {
      return;
    }

    var offset = this.model.get('offset');
    var pos = this.model.get('pos');
    var size = this.model.get('size');

    var left = pos.x - offset[0] + this.options.hookMargin;
    var bottom = -1 * (pos.y - offset[1] - size.y) + this.options.hookHeight;

    this.$el.css({ bottom: bottom, left: left });
  },

  /**
   *  Set visibility infowindow
   */
  showInfowindow: function () {
    this.model.set('visibility', true);
  }
});

module.exports = Infowindow;
