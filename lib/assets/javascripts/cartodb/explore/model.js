var Backbone = require('backbone-cdb-v3');

module.exports = Backbone.Model.extend({
  url: function() {
    return '//' + cdb.config.get('explore_user') + '.' + cdb.config.get('account_host') + '/api/v2/sql';
  },

  parse: function(models) {
    return models.rows[0];
  },

  fetch: function(callback) {
    var opts = _.extend({ data: { q: this._generateQuery() } }, callback);
    Backbone.Model.prototype.fetch.call(this, opts);
  },

  _generateQuery: function() {
    var fields = [
      'visualization_mapviews::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 AS mapviews_trend',
      'visualization_name AS name',
      'user_username AS username',
      'visualization_id AS id',
      'visualization_likes AS likes',
      'visualization_title AS title'
    ].join(',');

    var queryTemplate = 'SELECT <%= fields %> FROM visualizations ORDER BY mapviews_trend DESC LIMIT 1';

    return _.template(queryTemplate, {
      fields: fields
    });
  }
});
