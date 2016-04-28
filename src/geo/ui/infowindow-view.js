var _ = require('underscore');
var $ = require('jquery');
var Ps = require('perfect-scrollbar');
require('clip-path');
var templates = require('cdb.templates');
var sanitize = require('../../core/sanitize');
var Template = require('../../core/template');
var View = require('../../core/view');
var util = require('../../core/util');

/**
 * Usage:
 * var infowindow = new Infowindow({
 *   model: infowindowModel,
 *   mapView: mapView
 * });
 *
 * // Show the infowindow:
 * infowindow.showInfowindow();
 */

var Infowindow = View.extend({
  options: {
    imageTransitionSpeed: 300,
    hookMargin: 24,
    hookHeight: 16
  },

  className: 'CDB-infowindow-wrapper',

  events: {
    // Close bindings
    'click .close': '_closeInfowindow',
    'touchstart .close': '_closeInfowindow',
    'MSPointerDown .close': '_closeInfowindow',
    // Rest infowindow bindings
    'dragstart': '_checkOrigin',
    'mousedown': '_checkOrigin',
    'touchstart': '_checkOrigin',
    'MSPointerDown': '_checkOrigin',
    'dblclick': '_stopPropagation',
    'DOMMouseScroll': '_stopBubbling',
    'MozMousePixelScroll': '_stopBubbling',
    'mousewheel': '_stopBubbling',
    'dbclick': '_stopPropagation',
    'click': '_stopPropagation'
  },

  initialize: function () {
    this.mapView = this.options.mapView;

    // Set template if it is defined in options
    if (this.options.template) {
      this.model.set('template', this.options.template);
    }

    // Set template view variable and
    // compile it if it is necessary
    if (this.model.get('template')) {
      this._compileTemplate();
    } else {
      this._setTemplate();
    }

    this._initBinds();

    // Hide the element
    this.$el.hide();
  },

  setLoading: function () {
    this.model.set({
      content: {
        fields: [{
          type: 'loading',
          title: 'loading',
          value: '…'
        }]
      }
    });
    return this;
  },

  setError: function () {
    this.model.set({
      content: {
        fields: [{
          title: null,
          alternative_name: null,
          value: 'There has been an error...',
          index: null,
          type: 'error'
        }],
        data: {}
      }
    });

    return this;
  },

  /**
   * Set the correct position for the infowindow
   */
  setLatLng: function (latlng) {
    this.model.set('latlng', latlng);
    return this;
  },

  /**
   *  Adjust pan to show correctly the infowindow
   */
  adjustPan: function () {
    var offset = this.model.get('offset');

    if (!this.model.get('autoPan') || this.isHidden()) { return; }

    var containerHeight = this.$el.outerHeight(true) + 15; // Adding some more space
    var containerWidth = this.$el.width();
    var pos = this.mapView.latLonToPixel(this.model.get('latlng'));
    var adjustOffset = {x: 0, y: 0};
    var size = this.mapView.getSize();
    var wait_callback = 0;

    if (pos.x - offset[0] < 0) {
      adjustOffset.x = pos.x - offset[0] - 10;
    }

    if (pos.x - offset[0] + containerWidth > size.x) {
      adjustOffset.x = pos.x + containerWidth - size.x - offset[0] + 10;
    }

    if (pos.y - containerHeight < 0) {
      adjustOffset.y = pos.y - containerHeight - 10;
    }

    if (pos.y - containerHeight > size.y) {
      adjustOffset.y = pos.y + containerHeight - size.y;
    }

    if (adjustOffset.x || adjustOffset.y) {
      this.mapView.panBy(adjustOffset);
      wait_callback = 300;
    }

    return wait_callback;
  },

  /**
   *  Render infowindow content
   */
  render: function () {
    if (this.template) {
      // Clone fields and template name
      var fields = _.map(this.model.attributes.content.fields, function (field) {
        return _.clone(field);
      });

      var data = this.model.get('content') ? this.model.get('content').data : {};

      // If a custom template is not applied, let's sanitized
      // fields for the template rendering
      if (this.model.get('template_name')) {
        var template_name = _.clone(this.model.attributes.template_name);

        // Sanitized them
        fields = this._fieldsToString(fields, template_name);
      }

      // Join plan fields values with content to work with
      // custom infowindows and CartoDB infowindows.
      var values = {};

      _.each(this.model.get('content').fields, function (pair) {
        values[pair.title] = pair.value;
      });

      var obj = _.extend({
        content: {
          fields: fields,
          data: data
        }
      }, values);

      this.$el.html(
        sanitize.html(this.template(obj), this.model.get('sanitizeTemplate'))
      );

      // Set width and max-height from the model only
      // If there is no width set, we don't force our infowindow
      if (this.model.get('width')) {
        this.$('.js-infowindow').css('width', this.model.get('width') + 'px');
      }

      if (this.model.get('maxHeight')) {
        this.$('.js-content').css('max-height', this.model.get('maxHeight') + 'px');
      }

      if (this._containsCover()) {
        this._loadCover();
      }

      this._setupClasses();
      this._renderScroll();
    }

    return this;
  },

  _initBinds: function () {
    _.bindAll(this, '_onKeyUp', '_onLoadImage', '_onLoadImageError');

    this.model.bind('change:content change:alternative_names change:width change:maxHeight', this.render, this);
    this.model.bind('change:template_name', this._setTemplate, this);
    this.model.bind('change:latlng', this._update, this);
    this.model.bind('change:visibility', this.toggle, this);
    this.model.bind('change:template change:sanitizeTemplate', this._compileTemplate, this);

    this.mapView.map.bind('change', this._updatePosition, this);

    this.mapView.bind('zoomstart', function () {
      this.hide(true);
    }, this);

    this.mapView.bind('zoomend', function () {
      this.show(true);
    }, this);

    this.add_related_model(this.mapView.map);
    this.add_related_model(this.mapView);
  },

  _onKeyUp: function (e) {
    if (e && e.keyCode === 27) {
      this._closeInfowindow();
    }
  },

  _setupClasses: function () {
    var $infowindow = this.$('.js-infowindow');

    var hasHeader = this.$('.js-header').length;
    var hasCover = this.$('.js-cover').length;
    var hasContent = this.$('.js-content').length;
    var hasTitle = this.$('.CDB-infowindow-title').length;

    if (hasCover) {
      $infowindow.addClass('has-header-image');
    }
    if (hasHeader) {
      $infowindow.addClass('has-header');
    }
    if (hasContent) {
      $infowindow.addClass('has-fields');
    }
    if (hasTitle) {
      $infowindow.addClass('has-title');
    }
  },

  _renderScroll: function () {
    if (this.$('.js-content').length === 0) {
      return;
    }

    this.$('.js-infowindow').addClass('has-scroll');

    Ps.initialize(this.$('.js-content').get(0), {
      wheelSpeed: 2,
      wheelPropagation: true,
      minScrollbarLength: 20
    });
  },

  _getModelTemplate: function () {
    return this.model.get('template_name');
  },

  /**
   *  Change template of the infowindow
   */
  _setTemplate: function () {
    if (this.model.get('template_name')) {
      this.template = templates.getTemplate(this._getModelTemplate());
      this.render();
    }
  },

  /**
   *  Compile template of the infowindow
   */
  _compileTemplate: function () {
    var template = this.model.get('template') ? this.model.get('template') : templates.getTemplate(this._getModelTemplate());

    if (typeof (template) !== 'function') {
      this.template = new Template({
        template: template,
        type: this.model.get('template_type') || 'mustache'
      }).asFunction();
    } else {
      this.template = template;
    }

    this.render();
  },

  /**
   *  Check event origin
   */
  _checkOrigin: function (ev) {
    // If the mouse down come from jspVerticalBar
    // dont stop the propagation, but if the event
    // is a touchstart, stop the propagation
    var come_from_scroll = (($(ev.target).closest('.jspVerticalBar').length > 0) && (ev.type !== 'touchstart'));

    if (!come_from_scroll) {
      ev.stopPropagation();
    }
  },

  /**
   *  Convert values to string unless value is NULL
   */
  _fieldsToString: function (fields, template_name) {
    var fields_sanitized = [];
    if (fields && fields.length > 0) {
      var self = this;
      fields_sanitized = _.map(fields, function (field, i) {
        // Return whole attribute sanitized
        return self._sanitizeField(field, template_name, field.index || i);
      });
    }
    return fields_sanitized;
  },

  /**
   *  Sanitize fields, what does it mean?
   *  - If value is null, transform to string
   *  - If value is an url, add it as an attribute
   *  - Cut off title if it is very long (in header or image templates).
   *  - If the value is a valid url, let's make it a link.
   *  - More to come...
   */
  _sanitizeField: function (attr, template_name, pos) {
    // Check null or undefined :| and set both to empty == ''
    if (attr.value === null || attr.value === undefined) {
      attr.value = '';
    }

    // Get the alternative title
    var alternative_name = this.model.getAlternativeName(attr.title);

    if (attr.title && alternative_name) {
      // Alternative title
      attr.title = alternative_name;
    } else if (attr.title) {
      // Remove '_' character from titles
      attr.title = attr.title.replace(/_/g, ' ');
    }

    // Cast all values to string due to problems with Mustache 0 number rendering
    var new_value = attr.value.toString();

    // If it is index 0, not any field type, header template type and length bigger than 30... cut off the text!
    if (!attr.type && pos === 0 && attr.value.length > 35 && template_name && template_name.search('_header_') !== -1) {
      new_value = attr.value.substr(0, 32) + '...';
    }

    // If it is index 1, not any field type, header image template type and length bigger than 30... cut off the text!
    if (!attr.type && pos === 1 && attr.value.length > 35 && template_name && template_name.search('_header_with_image') !== -1) {
      new_value = attr.value.substr(0, 32) + '...';
    }

    // Is it the value a link?
    if (this._isValidURL(attr.value)) {
      new_value = "<a href='" + attr.value + "' target='_blank' class='CDB-infowindow-link'>" + new_value + '</a>';
    }

    // If it is index 0, not any field type, header image template type... don't cut off the text or add any link!!
    if (pos === 0 && template_name.search('_header_with_image') !== -1) {
      new_value = attr.value;
    }

    // Save new sanitized value
    attr.value = new_value;

    return attr;
  },

  /**
   *  Does header contain cover?
   */
  _containsCover: function () {
    return !!this.$('.js-infowindow').attr('data-cover');
  },

  _containsTemplateCover: function () {
    return this.$('.js-cover img').length > 0;
  },

  _getCoverURL: function () {
    var content = this.model.get('content');
    var imageSRC = this.$('.js-cover img').attr('src');

    if (imageSRC) {
      return imageSRC;
    }

    if (content && content.fields && content.fields.length > 0) {
      return (content.fields[0].value || '').toString();
    }

    return false;
  },

  _loadImageHook: function (imageDimensions, coverDimensions, url) {
    var $hook = this.$('.js-hook');

    if (!$hook) {
      return;
    }

    var $hookImage = $('<img />').attr('src', url);

    $hook.append($hookImage);

    $hookImage.attr('data-clipPath', 'M0,0 L0,16 L24,0 L0,0 Z');
    $hookImage.clipPath(imageDimensions.width, imageDimensions.height, -this.options.hookMargin, imageDimensions.height - this.options.hookHeight);

    $hookImage.load(function () {
      $hook.parent().addClass('has-image');
      $hookImage.css({
        marginTop: -coverDimensions.height,
        width: coverDimensions.width
      });
    });
  },

  _loadCoverFromTemplate: function (url) {
    this.$('.js-cover img').remove();
    this._loadCoverFromUrl(url);
  },

  _loadCoverFromUrl: function (url) {
    var $cover = this.$('.js-cover');

    this._startCoverLoader();

    var $img = $("<img class='CDB-infowindow-media-item' />").attr('src', url);
    $cover.append($img);
    $img.load(this._onLoadImage).error(this._onLoadImageError);
  },

  _onLoadImageError: function () {
    this._stopCoverLoader();
    this._showInfowindowImageError();
  },

  _onLoadImage: function () {
    var $cover = this.$('.js-cover');
    var $img = this.$('.CDB-infowindow-media-item');
    var url = $img.attr('src');

    var imageDimensions = { width: $img.width(), height: $img.height() };
    var coverDimensions = { width: $cover.width(), height: $cover.height() };

    var styles = this._calcImageStyle(imageDimensions, coverDimensions);

    $img.css(styles);

    $cover.css({ height: imageDimensions.height - this.options.hookHeight });

    this._stopCoverLoader();

    $img.fadeIn(150);

    this._loadImageHook(imageDimensions, coverDimensions, url);
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

    if (this._isValidURL(url)) {
      this._clearInfowindowImageError();
    } else {
      this._showInfowindowImageError();
      return;
    }

    if (this._containsTemplateCover()) {
      this._loadCoverFromTemplate(url);
    } else {
      this._loadCoverFromUrl(url);
    }
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

  /**
   *  Toggle infowindow visibility
   */
  toggle: function () {
    if (this.model.get('visibility')) {
      this.show();
    } else {
      this.hide();
    }
  },

  /**
   *  Stop event bubbling
   */
  _stopBubbling: function (e) {
    e.preventDefault();
    e.stopPropagation();
  },

  _stopPropagation: function (ev) {
    ev.stopPropagation();
  },

  /**
   *  Close infowindow
   */
  _closeInfowindow: function (ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    if (this.model.get('visibility')) {
      this.model.set('visibility', false);
    }
  },

  /**
   *  Show infowindow (update, pan, etc)
   */
  show: function (no_pan) {
    $(document)
      .off('keyup', this._onKeyUp)
      .on('keyup', this._onKeyUp);

    if (this.model.get('visibility')) {
      this.$el.css({ left: -5000 });
      this._update(no_pan);
    }
  },

  /**
   *  Get infowindow visibility
   */
  isHidden: function () {
    return !this.model.get('visibility');
  },

  /**
   *  Set infowindow to hidden
   */
  hide: function (force) {
    $(document).off('keyup', this._onKeyUp);
    if (force || !this.model.get('visibility')) this._animateOut();
  },

  /**
   *  Update infowindow
   */
  _update: function (no_pan) {
    if (!this.isHidden()) {
      var delay = 0;

      if (!no_pan) {
        delay = this.adjustPan();
      }

      this._updatePosition();
      this._animateIn(delay);
    }
  },

  /**
   *  Animate infowindow to show up
   */
  _animateIn: function (delay) {
    if (!util.ie || (util.browser.ie && util.browser.ie.version > 8)) {
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
        }, 300);
    } else {
      this.$el.show();
    }
  },

  /**
   *  Animate infowindow to disappear
   */
  _animateOut: function () {
    if (!util.ie || (util.browser.ie && util.browser.ie.version > 8)) {
      var self = this;
      this.$el.animate({
        marginBottom: '-10px',
        opacity: '0',
        display: 'block'
      }, 180, function () {
        self.$el.css({visibility: 'hidden'});
      });
    } else {
      this.$el.hide();
    }
  },

  /**
   *  Update the position (private)
   */
  _updatePosition: function () {
    if (this.isHidden()) {
      return;
    }

    var offset = this.model.get('offset');
    var pos = this.mapView.latLonToPixel(this.model.get('latlng'));
    var left = pos.x - offset[0];
    var size = this.mapView.getSize();
    var bottom = -1 * (pos.y - offset[1] - size.y);

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
