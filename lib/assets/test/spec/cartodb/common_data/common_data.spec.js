
describe("common-data", function() {
  var view
    , tables
    , user;

  beforeEach(function() {
    tables = new cdb.admin.Tables();
    user = new cdb.admin.User({ 
      id : "1",
      name: 'test',
      table_quota: 1,
      quota_in_bytes: 1000000,
      remaining_byte_quota: 10000,
      api_calls: [2,1,23]
    });

    tables.reset([{name: 'test'}]);

    var $table = $("<table>");

    var collection = [{ 
      name: "World borders",
      description: "World countries borders",
      author: null,
      author_url: null,
      url: "http://cartodb.s3.amazonaws.com/static/TM_WORLD_BORDERS_SIMPL-0.3.zip",
      size: 100,
      rows: 246
    }, { 
      name: "European countries",
      description: "European countries geometries",
      author: null,
      author_url: null,
      url: "http://cartodb.s3.amazonaws.com/static/european_countries.zip",
      size: 100,
      rows: 46
    }];

    view = new cdb.admin.CommonTablesView({
      collection: new Backbone.Collection(collection),
      user: user,
      el: $table
    })
  });

  it("should render correctly 2 public tables", function() {
    view.render();
    expect(view.$('tr').size()).toBe(2);
    expect(view.$('tr td.over_quota').size()).toBe(0);
  });

  it("should render again public tables if user model has changed", function() {
    // Using clearsubviews method, a function launched from render function (shame on jasmine)
    view.render();
    spyOn(view, 'clearSubViews');
    user.set("remaining_table_quota", 0);
    expect(view.clearSubViews).toHaveBeenCalled();
    expect(view.$('tr td.over_quota').size()).toBe(4);
  });

});
