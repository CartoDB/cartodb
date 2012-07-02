/**
 * Show the user settings urls
 *
 * It shows the several options of the user settings 
 *
 * usage example:
 *
 *    var settings = new cdb.ui.common.Settings({
 *        el: "#settings_element",
 *        speed: 300
 *    });
 *    settings.show();
 *    // close it
 *    settings.close();
*/

cdb.ui.common.Settings = cdb.core.View.extend({

  tagName: 'div',
  className: 'settings',

  events: {
    'click .close': 'hide'
  },

  default_options: {
      speed: 300
  },

  initialize: function() {
    this.closeTimeout = -1;
    _.defaults(this.options, this.default_options);
    this.template_base = _.template(this.options.template_base || cdb.templates.getTemplate('common/notification') || '');
    this.$el.hide();
  },

  render: function() {
    var $el = this.$el;
    $el.html(this.template_base(this.options));
    return this;
  },

  hide: function() {
    this.$el.fadeOut(this.options.speed);
  },

  open: function() {
    this.$el.fadeIn(this.options.speed);
  }

});
