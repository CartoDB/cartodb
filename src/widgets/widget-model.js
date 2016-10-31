var _ = require('underscore');
var cdb = require('cartodb.js');
var AutoStylerFactory = require('./auto-style/factory');

/**
 * Default widget model
 *
 * Note: Currently all widgets have a dependency on a dataview, why it makes sense to have it here.
 * If you need a widget model that's backed up by a dataview model please implement your own model and adhere to the
 * public interface instead of extending/hacking this one.
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    attrsNames: [],
    show_stats: false
  },

  defaultState: {
    'collapsed': false
  },

  initialize: function (attrs, opts) {
    this.dataviewModel = opts.dataviewModel;

    this.activeAutoStyler();
    this.bind('change:style', this.activeAutoStyler, this);
  },

  activeAutoStyler: function (e) {
    var style = e && e.changed && e.changed.style;
    if (this.isAutoStyleEnabled(style) && !this.autoStyler) {
      this.autoStyler = AutoStylerFactory.get(this.dataviewModel, this.get('style'));
    }
  },

  /**
   * @public
   * @param {Object} attrs, not that it should be
   * @return {Boolean} true if at least one attribute was changed
   * @throws {Error} Should throw an error if the attrs are invalid or inconsistent
   */
  update: function (attrs) {
    var wAttrs = _.pick(attrs, this.get('attrsNames'));
    this.set(wAttrs);
    this.dataviewModel.update(attrs);
    return !!(this.changedAttributes() || this.dataviewModel.changedAttributes());
  },

  /**
   * @public
   */
  remove: function () {
    this.dataviewModel.remove();
    this.trigger('destroy', this);
    this.stopListening();
  },

  isAutoStyleEnabled: function (autoStyle) {
    var styles = this.get('style');

    if ((!styles || !styles.auto_style) && (this.get('type') === 'category' || this.get('type') === 'histogram')) return true;
    return styles && styles.auto_style && styles.auto_style.allowed;
  },

  getWidgetColor: function () {
    var styles = this.get('style');

    return styles && styles.widget_style &&
          styles.widget_style.definition &&
          styles.widget_style.definition.color &&
          styles.widget_style.definition.color.fixed;
  },

  getColor: function (name) {
    if (this.isAutoStyleEnabled() && this.isAutoStyle()) {
      return this.autoStyler.colors.getColorByCategory(name);
    } else {
      return this.getWidgetColor();
    }
  },

  isAutoStyle: function () {
    return this.get('autoStyle');
  },

  autoStyle: function () {
    if (!this.isAutoStyleEnabled()) return;

    var layer = this.dataviewModel.layer;

    if (!layer.get('initialStyle')) {
      var initialStyle = layer.get('cartocss');
      if (!initialStyle && layer.get('meta')) {
        initialStyle = layer.get('meta').cartocss;
      }
      layer.set('initialStyle', initialStyle);
    }

    var style = this.autoStyler.getStyle();
    layer.set('cartocss', style);
    this.set('autoStyle', true);
  },

  reapplyAutoStyle: function () {
    var style = this.autoStyler.getStyle();
    this.dataviewModel.layer.set('cartocss', style);
    this.set('autoStyle', true);
  },

  cancelAutoStyle: function (noRestore) {
    if (!noRestore) {
      this.dataviewModel.layer.restoreCartoCSS();
    }
    this.set('autoStyle', false);
  },

  getAutoStyle: function getAutoStyle () {
    var style = this.get('style');
    var cartocss = this.dataviewModel.layer.get('cartocss');

    if (style && style.auto_style && style.auto_style.definition) {
      var toRet = _.extend(style.auto_style, {cartocss: this.dataviewModel.layer.get('cartocss')});

      return _.extend(toRet, {definition: this.autoStyler.getDef(cartocss)});
    } else {
      return {
        definition: this.autoStyler.getDef(cartocss),
        cartocss: cartocss
      };
    }
  },

  setState: function (state) {
    this.set(state);
  },

  getState: function () {
    var state = {};
    for (var key in this.defaultState) {
      var attribute = this.get(key);
      var defaultValue = this.defaultState[key];
      if (typeof defaultValue !== 'undefined' && typeof attribute !== 'undefined' && !_.isEqual(attribute, defaultValue)) {
        state[key] = attribute;
      }
    }
    return state;
  }
});
