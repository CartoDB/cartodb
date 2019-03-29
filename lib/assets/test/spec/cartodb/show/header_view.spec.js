var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var HeaderView = require('../../../../javascripts/cartodb/show/header_view_static');

describe('show/header_view_static', function () {
  beforeEach(function () {
    var vizdata = TestUtil.createVis();
    this.view = new HeaderView({
      vizdata: vizdata
    });

    this.view.render();
  });

  it('should render', function () {
    expect(this.view.$('.vis').length).toEqual(1);
    expect(this.view.$('.vis_navigation nav a').length).toEqual(2);
    expect(this.view.$('.back').length).toEqual(1);
    expect(this.view.$('.privacy').length).toEqual(1);
    expect(this.view.$('.title').length).toEqual(1);
    expect(this.view.$('.options li a').length).toEqual(2);
    expect(this.view.$('.sync_status').length).toEqual(1);
    expect(this.view.$('.globalerror').length).toEqual(1);
  });
});
