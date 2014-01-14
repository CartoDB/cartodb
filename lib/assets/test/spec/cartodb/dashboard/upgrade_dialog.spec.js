describe("Upgrade dialog", function() {
  var tables, user, server;

  beforeEach(function() {
    server = sinon.fakeServer.create();
    tables = new cdb.admin.Tables();
    user = new cdb.admin.User({ 
      id : "1",
      username: 'test',
      table_quota: 1,
      quota_in_bytes: 1000000,
      remaining_byte_quota: 10000,
      api_calls: [2,1,23]
    });

    view = new cdb.admin.UpgradeDialog({
      model: user,
      config: {
        account_host: "localhost:3000",
        cartodb_com_hosted: true
      },
      requestDataType: 'json'
    });
  });

  it("should render correctly the plans list", function() {
    spyOn(view, '_setInstance');
    view.render();

    server.respondWith("GET", "http://localhost:3000/account/test.json",
      [200, {"Content-Type": "application/json"},
      '{"username":"test","available_plans": [{ "title":"MERCATOR", "desc":"", "price":299, "table_quota":1073741824, "support": "Online support", "private_tables": true, "removable_brand": true, "lump_sum": { "price":3299, "recurly_plan_code": "ls-mercator" } , "recurly_plan_code": "mercator" }] }']);

    server.respond();

    expect(view.$el.find('ul.instances > li').size()).toBe(1);
    expect(view.$el.find('li[data-recurly_plan_code="mercator"]').size()).toBe(1);
    expect(view._setInstance).toHaveBeenCalled();
  });


  it("should render correctly the plan list if user is dedicated", function() {
    spyOn(view, '_renderDedicated');
    view.render();

    server.respondWith("GET", "http://localhost:3000/account/test.json",
      [200, {"Content-Type": "application/json"},
      '{"username":"test","available_plans": [] }']);
    server.respond();
    expect(view._renderDedicated).toHaveBeenCalled();
  });


  it("should set a better instance by default", function() {
    spyOn(view, '_setInstance');
    view.render();

    server.respondWith("GET", "http://localhost:3000/account/test.json",
      [200, {"Content-Type": "application/json"},
      '{"username":"test","available_plans": [{ "title":"MERCATOR", "desc":"", "price":299, "table_quota":1073741824, "support": "Online support", "private_tables": true, "removable_brand": true, "lump_sum": { "price":3299, "recurly_plan_code": "ls-mercator" } , "recurly_plan_code": "mercator" }] }']);

    server.respond();

    expect(view._setInstance).toHaveBeenCalled();
  });
});
