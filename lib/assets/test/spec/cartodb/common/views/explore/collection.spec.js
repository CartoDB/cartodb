var $ = require('jquery');
var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var Visualizations = require('../../../../../../javascripts/cartodb/common/views/explore/feed_collection');

describe('common/views/explore/feed_collection', function() {

  beforeEach(function() {
    this.collection = new Visualizations();
  });

  it('should generate a query', function() {
    var query = 'SELECT user_avatar_url AS avatar_url,user_username AS username,visualization_geometry_types AS geom_types,visualization_id AS id,visualization_likes AS likes,visualization_mapviews AS mapviews,visualization_mapviews::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 AS mapviews_trend,visualization_likes::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 AS likes_trend,visualization_name AS name,visualization_table_names AS table_names,visualization_table_rows AS rows,visualization_table_size AS table_size,visualization_tags AS tags,visualization_title AS title,visualization_type AS type,visualization_updated_at AS updated_at FROM visualizations  ORDER BY likes_trend DESC LIMIT 8 OFFSET 0';

    expect(this.collection._generateQuery(null, 'likes', 0, 8)).toEqual(query);
  });

  it('should generate a query depending on the type', function() {
    var query = 'SELECT user_avatar_url AS avatar_url,user_username AS username,visualization_geometry_types AS geom_types,visualization_id AS id,visualization_likes AS likes,visualization_mapviews AS mapviews,visualization_mapviews::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 AS mapviews_trend,visualization_likes::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 AS likes_trend,visualization_name AS name,visualization_table_names AS table_names,visualization_table_rows AS rows,visualization_table_size AS table_size,visualization_tags AS tags,visualization_title AS title,visualization_type AS type,visualization_updated_at AS updated_at FROM visualizations WHERE visualization_type = \'datasets\' ORDER BY mapviews_trend DESC LIMIT 8 OFFSET 8';

    expect(this.collection._generateQuery('datasets', 'mapviews', 1, 8)).toEqual(query);
  });

});
