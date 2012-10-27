/**
 * Show or hide tiles loader
 *
 * Usage:
 *
 * var tiles_loader = new cdb.admin.TilesLoader();
 * mapWrapper.$el.append(tiles_loader.render().$el);
 *
 */


cdb.admin.TilesLoader = cdb.core.View.extend({

  id: "tiles_loader",

  default_options: {
    animationSpeed: 500,
    spinner_ops: {
      lines: 9,
      length: 0,
      width: 4,
      radius: 6,
      corners: 1,
      rotate: 0,
      color: '#000',
      speed: 1,
      trail: 60,
      shadow: false,
      hwaccel: false,
      className: 'spinner',
      zIndex: 2e9,
      top: '0',
      left: '0'
    }
  },

  initialize: function() {
    _.defaults(this.options, this.default_options);

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate('geo/tiles_loader');
  },

  render: function() {
    var $content = $(this.template(this.options));

    // Get spin target
    var spin_target = $content[0]
      , spin = new Spinner(this.options.spinner_ops).spin(spin_target);

    $(spin_target).show();
    this.$el.html($content);
    return this;
  },

  show: function(ev) {
    if (!$.browser.msie || ($.browser.msie && $.browser.version.search("9.") != -1)) {
      this.$el.fadeTo(this.options.animationSpeed, 1)
    } else {
      this.$el.show();
    }
    
  },

  hide: function(ev) {
    if (!$.browser.msie || ($.browser.msie && $.browser.version.search("9.") != -1)) {
      this.$el.stop(true).fadeTo(this.options.animationSpeed, 0)
    } else {
      this.$el.hide();
    }
  }

});
