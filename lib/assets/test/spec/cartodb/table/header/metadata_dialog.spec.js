describe("Metadata dialog", function() {

  var cartodb_layer, vis, user;

  beforeEach(function() {
    vis = new cdb.admin.Visualization({
      name:             "test_table",
      description:      "Dataset description",
      tags:             ["jam","testing"],
      privacy:          "PUBLIC",
      type:             "table"
    });

    cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});

    vis.map.layers.reset([
      new cdb.geo.MapLayer(),
      cartodb_layer
    ]);

    user = TestUtil.createUser();
    cartodb_layer.table.permission.owner = user;
    vis.permission.owner = user;

    view = new cdb.admin.MetadataDialog({
      vis: vis,
      user: user
    });
  });

  afterEach(function() {
    view.clean();
  });

  it("should render properly", function(done) {
    view.render();
    expect(view.$('section.modal:eq(0) h3').text()).toBe('Dataset metadata');
    expect(view.$('input[name="name"]').val()).toBe('test_table');
    expect(view.$('textarea[name="description"]').val()).toBe('Dataset description');
    // expect(view.$('input[name="source"]').val()).toBe('');
    // expect(view.$('input[name="license"]').val()).toBe('');
    expect(view.$('ul li.tagit-choice').size()).toBe(2);
    expect(view.$('div.info.error').length).toBe(1);
    expect(view.$('div.owner').length).toBe(0);
    expect(view.$('div.foot input[type="submit"]').length).toBe(1);

    setTimeout(function() {
      expect(view.$('.jspContainer').length).toBe(1);
      done();
    },100);
  });

  it("should render visualization metadata title if visualization is derived", function() {
    vis.set('type', 'derived');
    var new_view = new cdb.admin.MetadataDialog({
      vis: vis,
      user: user
    });
    new_view.render();
    expect(new_view.$('section.modal:eq(0) h3').text()).toBe('Map metadata');
    new_view.clean();
  });

  it("should render owner block and disable all fields if table owner is different", function() {
    // Table
    var new_guy = new cdb.admin.User({ username: 'tests', id: 10 });
    cartodb_layer.table.permission.owner = new_guy;
    vis.permission.owner = new_guy;

    view.render();
    expect(view.$('div.owner').length).toBe(1);
    expect(view.$('input[name="name"]').is('[readonly]')).toBeTruthy();
    expect(view.$('textarea[name="description"]').is('[readonly]')).toBeTruthy();
    // expect(view.$('input[name="source"]').is('[readonly]')).toBeTruthy();
    // expect(view.$('input[name="license"]').is('[readonly]')).toBeTruthy();
    expect(view.$('ul.readonly').length).toBe(1);
    expect(view.$('div.foot input[type="submit"]').length).toBe(0);
  });

  it("should disable all fields if table has a query applied", function() {
    // Table
    var new_guy = new cdb.admin.User({ username: 'tests', id: 10 });
    cartodb_layer.table.permission.owner = new_guy;
    vis.permission.owner = new_guy;

    view.render();
    expect(view.$('div.owner').length).toBe(1);
    expect(view.$('input[name="name"]').is('[readonly]')).toBeTruthy();
    expect(view.$('textarea[name="description"]').is('[readonly]')).toBeTruthy();
    // expect(view.$('input[name="source"]').is('[readonly]')).toBeTruthy();
    // expect(view.$('input[name="license"]').is('[readonly]')).toBeTruthy();
    expect(view.$('ul.readonly').length).toBe(1);
    expect(view.$('div.foot input[type="submit"]').length).toBe(0);
  });

  it("should render owner block and disable all fields if vis owner is different", function() {
    // Vis
    var new_guy = new cdb.admin.User({ username: 'tests', id: 10 });
    cartodb_layer.table.permission.owner = new_guy;
    vis.set('type', 'derived');
    vis.permission.owner = new_guy;
    
    view.render();
    expect(view.$('div.owner').length).toBe(1);
    expect(view.$('input[name="name"]').is('[readonly]')).toBeTruthy();
    expect(view.$('textarea[name="description"]').is('[readonly]')).toBeTruthy();
    // expect(view.$('input[name="source"]').is('[readonly]')).toBeTruthy();
    // expect(view.$('input[name="license"]').is('[readonly]')).toBeTruthy();
    expect(view.$('ul.readonly').length).toBe(1);
    expect(view.$('div.foot input[type="submit"]').length).toBe(0);
  });

  it("should render owner block and disable all fields if vis owner is different", function() {
    // Vis
    var new_guy = new cdb.admin.User({ username: 'tests', id: 10 });
    cartodb_layer.table.permission.owner = new_guy;
    vis.set('type', 'derived');
    vis.permission.owner = new_guy;
    
    view.render();
    expect(view.$('div.owner').length).toBe(1);
    expect(view.$('input[name="name"]').is('[readonly]')).toBeTruthy();
    expect(view.$('textarea[name="description"]').is('[readonly]')).toBeTruthy();
    // expect(view.$('input[name="source"]').is('[readonly]')).toBeTruthy();
    // expect(view.$('input[name="license"]').is('[readonly]')).toBeTruthy();
    expect(view.$('ul.readonly').length).toBe(1);
    expect(view.$('div.foot input[type="submit"]').length).toBe(0);
  });

  it("should disable name field when table is synced", function() {
    cartodb_layer.table.synchronization.set('id', 'test');
    view.render();
    expect(view.$('input[name="name"]').is('[readonly]')).toBeTruthy();
    expect(view.$('textarea[name="description"]').is('[readonly]')).toBeFalsy();
    // expect(view.$('input[name="source"]').is('[readonly]')).toBeFalsy();
    // expect(view.$('input[name="license"]').is('[readonly]')).toBeFalsy();
    expect(view.$('ul.readonly').length).toBe(0);
    expect(view.$('div.foot input[type="submit"]').length).toBe(1);
  });

  it("should disable all fields when table has a query applied", function() {
    cartodb_layer.table.sqlView = {
      isReadOnly: function() { return true; }
    }
    view.render();
    expect(view.$('input[name="name"]').is('[readonly]')).toBeTruthy();
    expect(view.$('textarea[name="description"]').is('[readonly]')).toBeTruthy();
    // expect(view.$('input[name="source"]').is('[readonly]')).toBeTruthy();
    // expect(view.$('input[name="license"]').is('[readonly]')).toBeTruthy();
    expect(view.$('ul.readonly').length).toBe(1);
    expect(view.$('div.foot input[type="submit"]').length).toBe(0);
  });

  it("should show error info when name input is empty and don't send response signal", function() {
    var called = false;
    var new_view = new cdb.admin.MetadataDialog({
      vis: vis,
      user: user,
      onResponse: function(r) {
        called = true;
      }
    });

    new_view.render();
    new_view.$('input[name="name"]').val('');
    new_view._ok();

    expect(new_view.$('.info.error').hasClass('active')).toBeTruthy();
    expect(called).toBeFalsy();
    
    new_view.clean();
  });

  it("should return all form data serialized", function() {
    var o = {};
    var new_view = new cdb.admin.MetadataDialog({
      vis: vis,
      user: user,
      onResponse: function(r) {
        o = r
      }
    });

    new_view.render();

    new_view.$('input[name="name"]').val('name');
    new_view.$('textarea[name="description"]').val('description');
    // new_view.$('input[name="source"]').val('source');
    // new_view.$('input[name="license"]').val('license');

    new_view._saveModel();

    expect(o.name).toBe('name');
    expect(o.description).toBe('description');
    // expect(o.source).toBe('source');
    expect(o.tags.length).toBe(2);
    // expect(o.license).toBe('license');

    new_view.clean();
  });

});
