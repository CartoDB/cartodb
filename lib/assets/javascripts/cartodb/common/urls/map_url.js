/**
 * URL for a map (derived vis).
 */
cdb.common.MapUrl = cdb.common.Url.extend({

  edit: function() {
    return this.toPath('map');
  },

  public: function() {
    return this.toPath('public_map');
  }
});
