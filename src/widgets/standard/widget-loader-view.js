var cdb = require('cartodb.js');

/**
 *  Default widget loader view:
 *
 *  It will listen or not to dataviewModel changes when
 *  first load is done.
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Loader',

  initialize: function () {
    this._initBinds();
  },

  _initBinds: function () {
    var m = this.model.dataviewModel;
    if (m) {
      m.bind('loading', this.show, this);
      m.bind('sync error', this.hide, this);
      this.add_related_model(m);
    }
  },

  show: function () {
    this.$el.addClass('is-visible');
    clearTimeout(this._timeout);
  },

  hide: function () {
    var self = this;
    this._timeout = setTimeout(function () {
      self.$el.removeClass('is-visible');
    }, 500);
  }

});
