var _ = require('underscore');
var $ = require('jquery-proxy').get();
var templates = require('cdb.templates');
var View = require('../../core/view');
var util = require('../../core/util');

/**
 * Show or hide tiles loader
 *
 * Usage:
 *
 * var tiles_loader = new TilesLoader();
 * mapWrapper.$el.append(tiles_loader.render().$el);
 */
var TilesLoader = View.extend({

  className: "cartodb-tiles-loader",

  default_options: {
    animationSpeed: 500
  },

  initialize: function() {
    _.defaults(this.options, this.default_options);
    this.isVisible = 0;
    this.template = this.options.template ? this.options.template : templates.getTemplate('geo/tiles_loader');
  },

  render: function() {
    this.$el.html($(this.template(this.options)));
    return this;
  },

  show: function(ev) {
    if(this.isVisible) return;
    if (!util.ie || (util.browser.ie && util.browser.ie.version >= 10)) {
      this.$el.fadeTo(this.options.animationSpeed, 1)
    } else {
      this.$el.show();
    }
    this.isVisible++;
  },

  hide: function(ev) {
    this.isVisible--;
    if(this.isVisible > 0) return;
    this.isVisible = 0;
    if (!util.ie || (util.browser.ie && util.browser.ie.version >= 10)) {
      this.$el.stop(true).fadeTo(this.options.animationSpeed, 0)
    } else {
      this.$el.hide();
    }
  },

  visible: function() {
    return this.isVisible > 0;
  }

});

module.exports = TilesLoader;
