cdb.Widget.ListModel = cdb.core.Model.extend({

  options: {
    page: 0,
    per_page: 100
  },

  defaults: {
    data: [{ name: 'Paco', description: 'Jodo' }],
    columns: []
  },

  url: function() {
    return '/api/v1/list/' + this.get('id') + '/' + this.get('columns').join(',') + "?" + this._createUrlOptions();
  },

  initialize: function() {
    this._data = new Backbone.Collection(this.get('data'));
    this._initBinds();
  },

  _initBinds: function() {
    this.bind('change:id', function(){
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
        return k + "=" + encodeURIComponent(v)
      }
    )).join('&');
  },

  getData: function() {
    return this._data;
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
    }
  },

});
