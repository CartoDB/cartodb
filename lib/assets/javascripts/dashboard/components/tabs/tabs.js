const _ = require('underscore');
const $ = require('jquery');
const CoreView = require('backbone/core-view');

module.exports = CoreView.extend({

  events: {
    'click': '_click'
  },

  initialize: function () {
    _.bindAll(this, 'activate');
    this.preventDefault = false;
  },

  activate: function (name) {
    this.$('a').removeClass('selected');
    this.$('a[href$="#' + ((this.options.slash) ? '/' : '') + name + '"]').addClass('selected');
  },

  desactivate: function (name) {
    this.$('a[href$="#' + ((this.options.slash) ? '/' : '') + name + '"]').removeClass('selected');
  },

  disable: function (name) {
    this.$('a[href$="#' + ((this.options.slash) ? '/' : '') + name + '"]').addClass('disabled');
  },

  enable: function (name) {
    this.$('a[href$="#' + ((this.options.slash) ? '/' : '') + name + '"]').removeClass('disabled');
  },

  getTab: function (name) {
    return this.$('a[href$="#' + ((this.options.slash) ? '/' : '') + name + '"]');
  },

  disableAll: function () {
    this.$('a').addClass('disabled');
  },

  removeDisabled: function () {
    this.$('.disabled').parent().remove();
  },

  _click: function (e) {
    if (e && this.preventDefault) e.preventDefault();

    var t = $(e.target).closest('a');
    const href = t.attr('href');

    if (!t.hasClass('disabled') && href) {
      var name = href.replace('#/', '#').split('#')[1];
      this.trigger('click', name);
    }
  },

  linkToPanel: function (panel) {
    this.preventDefault = true;
    panel.bind('tabEnabled', this.activate, this);
    this.bind('click', panel.active, panel);
  }

});
