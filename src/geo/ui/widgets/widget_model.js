/**
 *  Default widget model
 *
 */

cdb.geo.ui.Widget.Model = cdb.core.Model.extend({

  defaults: {
    url: '',
    data: [],
    columns: [],
    sync: true,
    bbox: true
  },

  url: function() {
    return this.get('url') + '?bbox=' + this.get('boundingBox');
  },

  initialize: function(attrs, opts) {
    this._initBinds();
  },

  _initBinds: function() {
    this.once('change:url', function() {
      var self = this;
      this._fetch(function() {
        self._onChangeBinds();
      });
    }, this);
  },

  _onChangeBinds: function() {
    this.bind('change:url', function(){
      if (this.get('sync')) {
        this._fetch();
      }
    }, this);
    this.bind('change:boundingBox', function() {
      if (this.get('bbox')) {
        this._fetch();
      }
    }, this);
  },

  _fetch: function(callback) {
    var self = this;
    this.fetch({
      success: callback,
      error: function() {
        self.trigger('error');
      }
    });
  },

  _createUrlOptions: function() {
    return _.compact(_(this.options).map(
      function(v, k) {
        return k + "=" + encodeURIComponent(v);
      }
    )).join('&');
  },

  getData: function() {
    return this.get('data');
  },

  fetch: function(opts) {
    this.trigger("loading", this);
    return cdb.core.Model.prototype.fetch.call(this,opts);
  },

  toJSON: function() {
    throw new Error('toJSON should be defined for each widget');
  }

});
