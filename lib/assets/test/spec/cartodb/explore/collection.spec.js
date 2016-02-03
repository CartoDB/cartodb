var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var Visualizations = require('../../../../javascripts/cartodb/explore/feed_collection');

describe('explore/feed_collection', function() {

  beforeEach(function() {
    this.collection = new Visualizations();
  });

  it('should generate a query', function() {
    var query = 'WITH m As (SELECT max(visualization_likes) As max_likes, max(visualization_mapviews) As max_views FROM visualizations) SELECT user_avatar_url AS avatar_url,user_username AS username,visualization_geometry_types AS geom_types,visualization_id AS id,visualization_likes AS likes,visualization_mapviews AS mapviews,visualization_mapviews::numeric / (1.0 + (now()::date - visualization_created_at::date)::numeric)^2 * 100.0 / m.max_views As mapviews_trend,visualization_likes::numeric / (1.0 + (now()::date - visualization_created_at::date)::numeric)^2 * 100.0 / m.max_likes As likes_trend,visualization_name AS name,visualization_map_datasets AS map_datasets,visualization_table_rows AS rows,visualization_table_size AS table_size,visualization_tags AS tags,visualization_title AS title,visualization_type AS type,visualization_created_at AS created_at,visualization_updated_at AS updated_at FROM visualizations, m  ORDER BY likes_trend DESC, created_at DESC, visualization_id DESC LIMIT 8 OFFSET 0';

    expect(this.collection._generateQuery(null, 'likes', 0, 8)).toEqual(query);
  });

  it('should generate a query depending on the type', function() {
    var query = 'WITH m As (SELECT max(visualization_likes) As max_likes, max(visualization_mapviews) As max_views FROM visualizations) SELECT user_avatar_url AS avatar_url,user_username AS username,visualization_geometry_types AS geom_types,visualization_id AS id,visualization_likes AS likes,visualization_mapviews AS mapviews,visualization_mapviews::numeric / (1.0 + (now()::date - visualization_created_at::date)::numeric)^2 * 100.0 / m.max_views As mapviews_trend,visualization_likes::numeric / (1.0 + (now()::date - visualization_created_at::date)::numeric)^2 * 100.0 / m.max_likes As likes_trend,visualization_name AS name,visualization_map_datasets AS map_datasets,visualization_table_rows AS rows,visualization_table_size AS table_size,visualization_tags AS tags,visualization_title AS title,visualization_type AS type,visualization_created_at AS created_at,visualization_updated_at AS updated_at FROM visualizations, m WHERE visualization_type = \'datasets\' ORDER BY mapviews_trend DESC, created_at DESC, visualization_id DESC LIMIT 8 OFFSET 8';

    expect(this.collection._generateQuery('datasets', 'mapviews', 1, 8)).toEqual(query);
  });

});
