/**
 * URL for a map (derived vis).
 */
cdb.common.MapUrl = cdb.common.Url.extend({

  edit: function() {
    return this.urlToPath('map');
  },

  public: function() {
    return this.urlToPath('public_map');
  }
});
