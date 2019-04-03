var View = require('../../core/view');

/**
 * Show or hide tiles loader
 *
 * Usage:
 *
 * var tiles_loader = new TilesLoader();
 * mapWrapper.$el.append(tiles_loader.render().$el);
 */
var TilesLoader = View.extend({
  className: 'CDB-Loader',

  options: {
    animationSpeed: 500
  },

  initialize: function () {
    this.isVisible = 0;
  },

  render: function () {
    return this;
  },

  show: function (ev) {
    if (this.isVisible) {
      return;
    }
    this.$el.addClass('is-visible');
    this.isVisible++;
  },

  hide: function (ev) {
    this.isVisible--;
    if (this.isVisible > 0) {
      return;
    }
    this.isVisible = 0;
    this.$el.removeClass('is-visible');
  },

  visible: function () {
    return this.isVisible > 0;
  }

});

module.exports = TilesLoader;
