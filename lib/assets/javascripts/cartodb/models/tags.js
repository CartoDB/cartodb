cdb.admin.Tags = cdb.core.Model.extend({
  urlRoot: '/api/v1/tags',
  initialize: function() {
  },
  parse: function(contents) {
    this.clear();
    return contents;
  }
});
