cdb.geo.ui.Widget.CategoryModel = cdb.geo.ui.Widget.Model.extend({

  defaults: {
    data: [],
    columns: []
  },

  url: function() {
    // TODO: replace list by category :D
    return this.get('dashboardBaseURL') + '/list/' + this.get('id');
  },

  initialize: function() {
    this._data = new Backbone.Collection(this.get('data'));
    this._initBinds();
  },

  _initBinds: function() {
    this.bind('change:dashboardBaseURL', function(){
      var self = this;
      this.fetch({
        error: function() {
          self.trigger('error');
        }
      });
    }, this);
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
