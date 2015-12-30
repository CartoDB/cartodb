var _ = require('underscore');
var $ = require('jquery');
var Ps = require('perfect-scrollbar');
require('clip-path');
var log = require('cdb.log');
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

      this._renderLoader();
      this._startLoader();

      this._loadCover();

      if (!this.isLoadingData()) {
        this.model.trigger('domready', this, this.$el);
        this.trigger('domready', this, this.$el);
        this._stopLoader();
      }

      this._renderScroll();
    }

    return this;
  },

  _initBinds: function () {
    _.bindAll(this, '_onKeyUp');

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

  _renderLoader: function () {
    this.$('.js-inner').append('<div class="CDB-Loader js-loader"></div>');
  },

  _startLoader: function () {
    this.$('.js-inner').addClass('is-loading');
    this.$('.js-loader').addClass('is-visible');
  },

  _stopLoader: function () {
    if (this._containsCover() && this._coverLoading) {
      return;
    }
    this.$('.js-inner').removeClass('is-loading');
    this.$('.js-loader').removeClass('is-visible');
  },

  _renderScroll: function () {
    if (this.$('.has-scroll').length === 0) return;

    Ps.initialize(this.el.querySelector('.js-content'), {
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

  isLoadingData: function () {
    var content = this.model.get('content');
    return content.fields && content.fields.length === 1 && content.fields[0].type === 'loading';
  },

  /**
   *  Does header contain cover?
   */
  _containsCover: function () {
    return !!this.$('.js-infowindow').attr('data-cover');
  },

  /**
   *  Get cover URL
   */
  _getCoverURL: function () {
    var content = this.model.get('content');

    if (content && content.fields && content.fields.length > 0) {
      return (content.fields[0].value || '').toString();
    }

    return false;
  },

  _loadImageHook: function (width, height, y, url) {
    var $hook = this.$('.js-hook');
    var $cover = this.$('.js-cover');

    if ($hook) {
      var $hookImage = $('<img />').attr('src', url);
      $hook.append($hookImage);

      var $img = $hook.find('img');

      $img.attr('data-clipPath', 'M0,0 L0,16 L24,0 L0,0 Z');
      $img.clipPath(width, height, -this.options.hookMargin, y);

      $hookImage.load(function () {
        $hookImage.css({
          marginTop: -$cover.height(),
          width: $cover.width()
        });
      });
    }
  },

  /**
   *  Attempts to load the cover URL and show it
   */
  _loadCover: function () {
    if (!this._containsCover()) {
      return;
    }

    var self = this;

    var $cover = this.$('.js-cover');
    var $img = $cover.find('img');
    var url = this._getCoverURL();

    if ($img.length > 0) {
      $img.addClass('CDB-infowindow-media-item');
      url = $img.attr('src');

      var h = $img.height();
      var coverHeight = $cover.height();
      $cover.css({ height: h - this.options.hookHeight });

      this._loadImageHook($img.width(), coverHeight, h - this.options.hookHeight, url);

      return false;
    }

    if (!this._isValidURL(url)) {
      log.info('Header image url not valid');
      return;
    }

    this._startLoader();
    this._coverLoading = true;

    $img = $("<img class='CDB-infowindow-media-item' />").attr('src', url);

    $cover.append($img);

    $img.load(function () {
      var w = $img.width();
      var h = $img.height();

      var coverWidth = $cover.width();
      var coverHeight = $cover.height();

      var ratio = h / w;

      var coverRatio = coverHeight / coverWidth;

      var styles = {};

      // Resize rules
      if (w > coverWidth && h > coverHeight) { // bigger image
        if (ratio < coverRatio) {
          styles = { height: coverHeight };
        }
      }

      $img.css(styles);
      $cover.css({ height: h - self.options.hookHeight });
      $img.fadeIn(self.options.imageTransitionSpeed);

      self._coverLoading = false;
      self._stopLoader();

      self._loadImageHook($img.width(), $img.height(), h - self.options.hookHeight, url);
    }).error();
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

  /**
   *  Stop event propagation
   */
  _stopPropagation: function (ev) {
    ev.stopPropagation();
  },

  /**
   *  Set loading state adding its content
   */
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
   *  Close infowindow
   */
  _closeInfowindow: function (ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    if (this.model.get('visibility')) {
      this.model.set('visibility', false);
      this.trigger('close');
    }
  },

  /**
   *  Set visibility infowindow
   */
  showInfowindow: function () {
    this.model.set('visibility', true);
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
  }
});

module.exports = Infowindow;
