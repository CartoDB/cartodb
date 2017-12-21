var Backbone = require('backbone-cdb-v3');

module.exports = Backbone.Collection.extend({
  url: function() {
    return '//' + cdb.config.get('explore_user') + '.' + cdb.config.get('account_host') + '/api/v2/sql';
  },

  _SORT: {
    'likes': 'likes_trend',
    'updated_at': 'visualization_updated_at',
    'mapviews': 'mapviews_trend'
  },

  parse: function(models) {
    return models.rows;
  },

  fetch: function(opts) {

    var query = this._generateQuery(opts.type, opts.orderBy, opts.page, opts.limit);
    opts = _.extend({ q: query }, { reset: opts.reset });

    Backbone.Collection.prototype.fetch.call(this, { data: opts });
  },

  _generateQuery: function(type, orderBy, page, limit) {
    var fields = [
      'user_avatar_url AS avatar_url',
      'user_username AS username',
      'visualization_geometry_types AS geom_types',
      'visualization_id AS id',
      'visualization_likes AS likes',
      'visualization_mapviews AS mapviews',
      'visualization_mapviews::numeric / (1.0 + (now()::date - visualization_created_at::date)::numeric)^2 * 100.0 / m.max_views As mapviews_trend',
      'visualization_likes::numeric / (1.0 + (now()::date - visualization_created_at::date)::numeric)^2 * 100.0 / m.max_likes As likes_trend',
      'visualization_name AS name',
      'visualization_map_datasets AS map_datasets',
      'visualization_table_rows AS rows',
      'visualization_table_size AS table_size',
      'visualization_tags AS tags',
      'visualization_title AS title',
      'visualization_type AS type',
      'visualization_created_at AS created_at',
      'visualization_updated_at AS updated_at'
    ].join(',');

    var queryTemplate = 'WITH m As (SELECT max(visualization_likes) As max_likes, max(visualization_mapviews) As max_views FROM <%- table %>) SELECT <%= fields %> FROM <%- table %>, m <%= where %> ORDER BY <%- order_by %> DESC, created_at DESC, visualization_id DESC LIMIT <%- limit %> OFFSET <%- offset %>';

    return _.template(queryTemplate, {
      table: 'visualizations',
      fields: fields,
      order_by: this._SORT[orderBy],
      limit: limit,
      where: type ? 'WHERE visualization_type = \'' + type + '\'' : '',
      offset: limit * page
    });
  }
});
