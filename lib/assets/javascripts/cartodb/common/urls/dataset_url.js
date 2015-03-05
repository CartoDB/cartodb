/**
 * URL for a dataset (standard vis).
 */
cdb.common.DatasetUrl = cdb.common.Url.extend({

  edit: function() {
    return this.toPath();
  },

  public: function() {
    return this.toPath('public');
  }
});
