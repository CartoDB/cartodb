var View = require('cdb/core/view');

/**
 *  Default widget loader view:
 *
 *  It will listen or not to dataModel changes when
 *  first load is done.
 */
module.exports = View.extend({

  className: 'Widget-loader',

  initialize: function() {
    this._initBinds();
  },

  _initBinds: function() {
    this.model.bind('loading', this.show, this);
    this.model.bind('sync error', this.hide, this);
  },

  show: function() {
    this.$el.addClass('is-visible');
  },

  hide: function() {
    var self = this;
    setTimeout(function() {
      self.$el.removeClass('is-visible');
    }, 500);
  }

});
