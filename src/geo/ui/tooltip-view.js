var _ = require('underscore');
var InfoBox = require('./infobox');
var sanitize = require('../../core/sanitize');
var InfowindowModel = require('./infowindow-model');

var TooltipView = InfoBox.extend({
  defaultTemplate: '<p>{{text}}</p>',
  className: 'CDB-Tooltip-wrapper',

  defaults: {
    vertical_offset: 0,
    horizontal_offset: 0,
    position: 'top|center'
  },

  initialize: function () {
    if (!this.options.mapView) {
      throw new Error('mapView should be present');
    }
    this.options.template = this.options.template || this.defaultTemplate;
    InfoBox.prototype.initialize.call(this);
    this._filter = null;
    this.showing = false;
    this.showhideTimeout = null;
  },

  render: function (data) {
    var sanitizedOutput = sanitize.html(this.template(data));
    this.$el.html(sanitizedOutput);
    return this;
  },

  /**
   * sets a filter to open the tooltip. If the feature being hovered
   * pass the filter the tooltip is shown
   * setFilter(null) removes the filter
   */
  setFilter: function (f) {
    this._filter = f;
    return this;
  },

  setFields: function (fields) {
    this.options.fields = fields;
    return this;
  },

  setAlternativeNames: function (n) {
    this.options.alternative_names = n;
  },

  enable: function () {
    if (this.options.layer) {
      // unbind previous events
      this.options.layer.unbind(null, null, this);
      this.options.layer
        .on('mouseover', function (e, latlng, pos, data) {
          if (this.options.fields && this.options.fields.length > 0) {
            var non_valid_keys = ['fields', 'content'];

            if (this.options.omit_columns) {
              non_valid_keys = non_valid_keys.concat(this.options.omit_columns);
            }

            var c = InfowindowModel.contentForFields(data, this.options.fields, {
              show_empty_fields: false
            });

            // Remove fields and content from data
            // and make them visible for custom templates
            data.content = _.omit(data, non_valid_keys);

            // loop through content values
            data.fields = c.fields;

            // alternamte names
            var names = this.options.alternative_names;
            if (names) {
              for (var i = 0; i < data.fields.length; ++i) {
                var f = data.fields[i];
                f.title = names[f.title] || f.title;
              }
            }
            this.show(pos, data);
            this.showing = true;
          } else if (this.showing) {
            this.hide();
            this.showing = false;
          }
        }, this)
        .on('mouseout', function () {
          if (this.showing) {
            this.hide();
            this.showing = false;
          }
        }, this);
      this.add_related_model(this.options.layer);
    }
  },

  disable: function () {
    if (this.options.layer) {
      this.options.layer.unbind(null, null, this);
    }
    this.hide();
    this.showing = false;
  },

  _visibility: function () {
    var self = this;
    clearTimeout(this.showhideTimeout);
    this.showhideTimeout = setTimeout(self._showing ?
      function () { self.$el.fadeIn(100); }
      :
      function () { self.$el.fadeOut(200); }
      , 50);
  },

  hide: function () {
    if (this._showing) {
      this._showing = false;
      this._visibility();
    }
  },

  show: function (pos, data) {
    if (this._filter && !this._filter(data)) {
      return this;
    }
    this.render(data);
    this.setPosition(pos);
    if (!this._showing) {
      this._showing = true;
      this._visibility();
    }
    return this;
  },

  setPosition: function (point) {
    var pos = this.options.position;
    var height = this.$el.innerHeight();
    var width = this.$el.innerWidth();
    var mapViewSize = this.options.mapView.getSize();
    var top = 0;
    var left = 0;
    var modifierClass = 'CDB-Tooltip-wrapper--';

    // Remove tick class
    this._removePositionModifiers();

    // Vertically
    if (pos.indexOf('top') !== -1) {
      top = point.y - height;
    } else if (pos.indexOf('middle') !== -1) {
      top = point.y - (height / 2);
    } else { // bottom
      top = point.y;
    }

    // Fix vertical overflow
    if (top < 0) {
      top = point.y;
      modifierClass += 'top';
    } else if (top + height > mapViewSize.y) {
      top = point.y - height;
      modifierClass += 'bottom';
    } else {
      modifierClass += 'top';
    }

    // Horizontally
    if (pos.indexOf('left') !== -1) {
      left = point.x - width;
    } else if (pos.indexOf('center') !== -1) {
      left = point.x - (width / 2);
    } else { // right
      left = point.x;
    }

    // Fix horizontal overflow
    if (left < 0) {
      left = point.x;
      modifierClass += 'Left';
    } else if (left + width > mapViewSize.x) {
      left = point.x - width;
      modifierClass += 'Right';
    } else {
      modifierClass += 'Left';
    }

    // Add offsets
    top += this.options.vertical_offset;
    left += this.options.horizontal_offset;

    this.$el.css({
      top: top,
      left: left
    }).addClass(modifierClass);
  },

  _removePositionModifiers: function () {
    var positions = [ 'topLeft', 'topRight', 'bottomRight', 'bottomLeft' ];
    var positionModifiers = _.map(positions, function (className) {
      return this._modifierClassName(className);
    }, this);
    this.$el.removeClass(positionModifiers.join(' '));
  },

  _modifierClassName: function (className) {
    return this.className + '--' + className;
  }
});

module.exports = TooltipView;
