var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  url: 'http://common-data.cartodb.com/api/v2/sql',

  parse: function(models) {
    return models.rows[0];
  },

  generateQuery: function() {
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
