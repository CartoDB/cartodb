var cdb = require('cartodb.js');

/**
 *  Default widget loader view:
 *
 *  It will listen or not to dataviewModel changes when
 *  first load is done.
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-loader',

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.$el.append('<div class="CDB-Loader js-loader"></div>');
    return this;
  },

  show: function () {
    this.$('.js-loader').addClass('is-visible');
    clearTimeout(this._timeout);
  },

  hide: function () {
    var self = this;
    this._timeout = setTimeout(function () {
      self.$('.js-loader').removeClass('is-visible');
    }, 500);
  },

  _initBinds: function () {
    this.model.bind('loading', this.show, this);
    this.model.bind('error', function (mdl, err) {
      if (!err || (err && err.statusText !== 'abort')) {
        this.hide();
      }
    }, this);
    this.model.bind('loaded', this.hide, this);
  }
});
