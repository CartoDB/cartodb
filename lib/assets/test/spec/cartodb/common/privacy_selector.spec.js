
describe("Privacy selector", function() {
  var privacy_selector, vis;

  beforeEach(function() {
    vis = new cdb.admin.Visualization({
      map_id:           96,
      active_layer_id:  null,
      name:             "test_table",
      description:      "Visualization description",
      tags:             ["jamon","probando","test"],
      privacy:          "PUBLIC",
      updated_at:       "2013-03-04T18:09:34+01:00",
      type:             "table"
    });

    privacy_selector = new cdb.admin.PrivacySelector({
      model: vis,
      limitation: true,
      direction: 'down',
      upgrade_url: window.location.protocol + "//test.localhost.lan/account/development/upgrade"
    });
  });

  it("should render properly when you can't change to private tables", function() {
    privacy_selector.render();
    expect(privacy_selector.$('span.radio').length).toEqual(0);
    expect(privacy_selector.$('p:contains("Free users")').length).toEqual(1);
  });

  it("should render properly when you can change to private tables", function() {
    var new_privacy = new cdb.admin.PrivacySelector({
      model: vis,
      limitation: false,
      direction: 'down',
      upgrade_url: window.location.protocol + "//test.localhost.lan/account/development/upgrade"
    });

    new_privacy.render();
    expect(new_privacy.$('span.radio').length).toEqual(2);
    expect(new_privacy.$('li a:contains("Make this table public")').length).toEqual(1);
    expect(new_privacy.$('li a:contains("Make this table private")').length).toEqual(1);
  });

  it("should render properly when you can't change to private vis", function() {
    vis.set('type', 'derived');
    privacy_selector.render();
    expect(privacy_selector.$('span.radio').length).toEqual(0);
    expect(privacy_selector.$('p:contains("Free users")').length).toEqual(1);
  });

  it("should render properly when you can change to private visualizations", function() {
    vis.set('type', 'derived');
    var new_privacy = new cdb.admin.PrivacySelector({
      model: vis,
      limitation: false,
      direction: 'down',
      upgrade_url: window.location.protocol + "//test.localhost.lan/account/development/upgrade"
    });

    new_privacy.render();
    expect(new_privacy.$('span.radio').length).toEqual(2);
    expect(new_privacy.$('li a:contains("Make this vis private")').length).toEqual(1);
    expect(new_privacy.$('li a:contains("Make this vis public")').length).toEqual(1);
  });

  xit("shouldn't change the model if it selects the same privacy", function() {
    var new_privacy = new cdb.admin.PrivacySelector({
      model: vis,
      limitation: false,
      direction: 'down',
      upgrade_url: window.location.protocol + "//test.localhost.lan/account/development/upgrade"
    });

    spyOn(new_privacy.model, 'set');
    new_privacy.render();
    new_privacy.$('li a:eq(0)').click();

    expect(new_privacy.model.set).not.toHaveBeenCalled();
  });

  xit("should change the model when user clicks in private tables", function() {
    var new_privacy = new cdb.admin.PrivacySelector({
      model: vis,
      limitation: false,
      direction: 'down',
      upgrade_url: window.location.protocol + "//test.localhost.lan/account/development/upgrade"
    });

    new_privacy.render();
    new_privacy.$('li a:eq(1)').click();

    expect(new_privacy.warning).toBeDefined();
    expect(new_privacy.warning.$('h3').text()).toBe('Change table privacy');

    new_privacy.warning.$('a.ok').click();
    expect(new_privacy.model.get('privacy')).toBe('PRIVATE');

    new_privacy.warning.clean();
  });

  xit("should change the model when user clicks in private visualizations", function() {
    vis.set('type', 'derived', {silent:true})
    var new_privacy = new cdb.admin.PrivacySelector({
      model: vis,
      limitation: false,
      direction: 'down',
      upgrade_url: window.location.protocol + "//test.localhost.lan/account/development/upgrade"
    });

    new_privacy.render();
    new_privacy.$('li a:eq(1)').click();

    expect(new_privacy.warning).toBeDefined();
    expect(new_privacy.warning.$('h3').text()).toBe('Change visualization privacy');

    new_privacy.warning.$('a.ok').click();
    expect(new_privacy.model.get('privacy')).toBe('PRIVATE');

    new_privacy.warning.clean();
  });

  it("should show the 'related private tables' dialog properly when you change to private vis", function() {
    var new_vis = new cdb.admin.Visualization({
      map_id:           96,
      active_layer_id:  null,
      name:             "test_table",
      description:      "Visualization description",
      tags:             ["jamon","probando","test"],
      privacy:          "PRIVATE",
      updated_at:       "2013-03-04T18:09:34+01:00",
      type:             "derived",
      related_tables:   [{ id: "23423432", "table_name": "jamon", "privacy": "PRIVATE" }]
    });

    expect(new_vis.get('related_tables')).toBeTruthy();

    var new_privacy = new cdb.admin.PrivacySelector({
      model: new_vis,
      limitation: false,
      direction: 'down',
      upgrade_url: window.location.protocol + "//test.localhost.lan/account/development/upgrade"
    });

    new_privacy.render();

    new_privacy.$('li a.public').click();

    expect(new_privacy.warning).toBeDefined();
    expect(new_privacy.warning.options.title).toBe('Cannot make this visualization public')
    new_privacy.warning.clean();
  });

  it("should get 'related tables' when starts privacy dialog if visualization is derived type", function() {
    vis.set({
      'type': 'derived',
      'privacy': 'PRIVATE',
      'id': 5
    });

    var server = sinon.fakeServer.create();
    expect(vis.get('related_tables')).toBeFalsy();

    var new_privacy = new cdb.admin.PrivacySelector({
      model: vis,
      limitation: false,
      direction: 'down',
      upgrade_url: window.location.protocol + "//test.localhost.lan/account/development/upgrade"
    });

    server.respondWith('/api/v1/viz/5', [200, { "Content-Type": "application/json" }, '{ "related_tables": [{ "table_name": "jamon", "privacy": "PRIVATE" }] }']);
    server.respond();

    expect(vis.get('related_tables').length == 1).toBeTruthy();
  });

});
