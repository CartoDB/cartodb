var $ = require('jquery');
var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var ExploreModel = require('../../../../../../javascripts/cartodb/common/views/explore/model');

describe('common/views/explore/model', function() {

  beforeEach(function() {
    this.model = new ExploreModel();
  });

  it('should generate a query', function() {
    var query = 'SELECT visualization_mapviews::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 AS mapviews_trend,visualization_name AS name,user_username AS username,visualization_id AS id,visualization_likes AS likes,visualization_title AS title FROM visualizations ORDER BY mapviews_trend DESC LIMIT 1';

    expect(this.model._generateQuery()).toEqual(query);
  });

});
