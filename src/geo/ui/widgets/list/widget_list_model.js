cdb.geo.ui.Widget.ListModel = cdb.geo.ui.Widget.Model.extend({

  options: {
    page: 0,
    per_page: 100
  },

  defaults: {
    data: [],
    columns: []
  },

  url: function() {
    return this.get('url');
  },

  initialize: function() {
    this._data = new Backbone.Collection(this.get('data'));
    this._initBinds();
  },

  _initBinds: function() {
    this.bind('change:url', function(){
      var self = this;
      this.fetch({
        error: function() {
          self.trigger('error');
        }
      });
    }, this);
  },

  _createUrlOptions: function() {
    return _.compact(_(this.options).map(
      function(v, k) {
        return k + "=" + encodeURIComponent(v);
      }
    )).join('&');
  },

  getData: function() {
    return this._data;
  },

  getSize: function() {
    return this._data.size();
  },

  getDataSerialized: function() {
    return this.get('data');
  },

  fetch: function(opts) {
    this.trigger("loading", this);
    return cdb.core.Model.prototype.fetch.call(this,opts);
  },

  parse: function(r) {
    this._data.reset(r);
    return {
      data: r.data
    };
  }
});
