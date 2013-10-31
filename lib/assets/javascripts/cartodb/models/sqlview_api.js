/**
 * access to data using the api endpoint
 */
cdb.admin.SQLViewDataAPI = cdb.admin.SQLViewData.extend({

  url: function() {
    var u = this.sqlApiUrl();
    var o = _.clone(this.options.attributes);
    delete o.sql;
    o.q = this.options.get('sql');

    var params = _(o).map(function(v, k) {
      return k + "=" + encodeURIComponent(v);
    }).join('&');
    u += "?" + params;
    return u;
  },

  /**
   * do the call with jsonp to avoid CORS
   */
  fetch: function(opts) {
    opts = opts || {};
    //opts.dataType = "jsonp";
    return cdb.admin.SQLViewData.prototype.fetch.call(this, opts);
  },

  sync: function(method, model, options) {
    return Backbone.sync.call(this, method, model, options);
  }

});
