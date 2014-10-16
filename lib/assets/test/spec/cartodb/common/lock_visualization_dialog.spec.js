describe("Lock visualization dialog", function() {

  var view, vis, user, server;

  beforeEach(function() {
    vis = new cdb.admin.Visualization({
      locked:       false,
      name:         "test_table",
      description:  "Table description",
      tags:         ["jam","testing"],
      privacy:      "PUBLIC",
      type:         "table"
    });

    user = TestUtil.createUser();
    vis.permission.owner = user;

    view = new cdb.admin.LockVisualizationDialog({
      model: vis,
      user: user
    });
  });

  afterEach(function() {
    view.clean();
  });

  it("should render properly", function() {
    view.render();
    expect(view.$('h3').length === 1).toBeTruthy();
    expect(view.$('p').length === 1).toBeTruthy();
    expect(view.$('div.foot a').length === 2).toBeTruthy();
  });

  it("should show lock and unlock visualization dialog when user is the owner", function() {
    var called = false;
    view.options.onResponse = function() { called = true }

    vis.sync = function(method, model, options) { options.success({ "response": true }) }

    view.render();
    view.ok();

    expect(vis.get('locked')).toBeTruthy();
    expect(called).toBeTruthy();
  });

  it("shouldn't close dialog using ESC button when cancel is not enabled", function() {
    spyOn(view, 'hide');
    view.render();

    view.options.cancelEnabled = false;
    $(document).trigger(jQuery.Event( 'keydown', { keyCode: 27 } ));
    expect(view.hide).not.toHaveBeenCalled();

    view.options.cancelEnabled = true;
    $(document).trigger(jQuery.Event( 'keydown', { keyCode: 27 } ));
    expect(view.hide).toHaveBeenCalled();
  });

  it("should show warning when user is not the owner", function() {
    user1 = TestUtil.createUser();
    user1.set('id', 'jar');

    var v = new cdb.admin.LockVisualizationDialog({
      model: vis,
      user: user1
    });

    expect(view.$('a.ok').length === 0).toBeTruthy();
  });

  it("should not have leaks", function() {
    expect(view).toHaveNoLeaks();
  });

});
