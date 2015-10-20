describe('core.ui.common.TabPane', function() {

  var pane;

  beforeEach(function() {
    pane = new cdb.ui.common.TabPane();
  });

  it("getPreviousPane should return the last pane if the active pane is the first one", function() {

    var // Let's create the views
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View(),
    v3 = new cdb.core.View();

    // Add some tabs
    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);
    pane.addTab('tab3', v3);

    pane.active('tab1');

    expect(pane.getPreviousPane()).toEqual(v3);

  });
  it("getPreviousPane should return the previous pane", function() {

    var // Let's create the views
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View(),
    v3 = new cdb.core.View();

    // Add some tabs
    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);
    pane.addTab('tab3', v3);

    pane.active('tab2');

    expect(pane.getPreviousPane()).toEqual(v1);

  });

  it("getNextPane should return the next pane", function() {

    var // Let's create the views
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View(),
    v3 = new cdb.core.View();

    // Add some tabs
    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);
    pane.addTab('tab3', v3);

    pane.active('tab1');

    expect(pane.getNextPane()).toEqual(v2);

  });

  it("getNextPane should return the first pane if the last pane is active", function() {

    var // Let's create the views
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View(),
    v3 = new cdb.core.View();

    // Add some tabs
    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);
    pane.addTab('tab3', v3);

    pane.active('tab3');

    expect(pane.getNextPane()).toEqual(v1);

  });

  it("getActive should return the desired pane", function() {

    var // Let's create the views
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View(),
    v3 = new cdb.core.View();

    // Add some tabs
    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);
    pane.addTab('tab3', v3);

    expect(pane.getPane('tab1')).toEqual(v1);
    expect(pane.getPane('tab3')).toEqual(v3);
    expect(pane.getPane('tab2')).toEqual(v2);

  });

  it("getActivePane should return the active pane", function() {

    var // Let's create the views
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View(),
    v3 = new cdb.core.View();

    // Add some tabs
    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);
    pane.addTab('tab3', v3);

    // Finally, activate one of them
    pane.active('tab2');

    expect(pane.getActivePane()).toEqual(v2);

  });

  it("activating a tab should return the view", function() {

    var // Let's create the views
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View(),
    v3 = new cdb.core.View();

    // Add some tabs
    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);
    pane.addTab('tab3', v3);

    // Finally, activate one of them
    var activeView = pane.active('tab2');

    expect(activeView).toEqual(v2);

  });

  it("should allow to add a pane", function() {

    var v1 = new cdb.core.View();

    spy = {
      tabAdded: function(){}
    };

    spyOn(spy, 'tabAdded');

    pane.bind('tabAdded', spy.tabAdded, spy);

    pane.addTab('tab1', v1);

    expect(pane._subviews[v1.cid]).toBeTruthy();
    expect(pane.activeTab).toEqual('tab1');
    expect(pane.$el.children()[0]).toEqual(v1.el);
    expect(spy.tabAdded).toHaveBeenCalledWith('tab1', v1);

  });

  it("should allow to remove a pane", function() {

    var // Let's create the views
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View();

    // Add the views
    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);

    pane.active('tab1');

    pane.removeTab('tab1');

    expect(pane._subviews[v1.cid]).toBeFalsy();
    expect(pane.activeTab).toEqual('tab2');

    // There shold be only one children
    expect(pane.$el.children()[0]).toEqual(v2.el);
    expect(pane.$el.children().length).toEqual(1);

  });

  it("should remove all panels ", function() {
    var v1 = new cdb.core.View();
    var v2 = new cdb.core.View();
    spyOn(v1, 'clean');
    spyOn(v2, 'clean');
    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);
    pane.removeTabs();
    expect(_.keys(pane.tabs).length).toEqual(0);
    expect(v1.clean).toHaveBeenCalled()
    expect(v2.clean).toHaveBeenCalled()
  });

  it("should trigger on activate", function() {

    var // Let's create the views
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View();

    spy = {
      tabEnabled: function(){},
      tabDisabled: function(){}
    };

    spyOn(spy, 'tabDisabled');
    spyOn(spy, 'tabEnabled');

    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);

    expect(pane.activeTab).toEqual('tab2');

    pane.bind('tabEnabled', spy.tabEnabled, spy);
    pane.bind('tabDisabled', spy.tabDisabled, spy);

    pane.active('tab1');

    expect(spy.tabEnabled).toHaveBeenCalledWith('tab1', v1);
    expect(spy.tabDisabled).toHaveBeenCalledWith('tab2', v2);

    expect(v1.el.style.display).toEqual('block');
    expect(v2.el.style.display).toEqual('none');

  });

  it("should call activated and deactivaed on tab if exists", function() {

    var // Let's create the views
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View();

    v1.activated = function() {};
    v2.deactivated = function() {};

    spyOn(spy, 'tabDisabled');
    spyOn(spy, 'tabEnabled');

    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);
    var a = spyOn(v1, 'activated');
    var d = spyOn(v2, 'deactivated');
    pane.active('tab1');
    expect(a).toHaveBeenCalled();
    expect(d).toHaveBeenCalled();
  });

  it("each should call function for each tab", function() {
    var // Let's create the views
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View();
    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);
    var t = [];
    pane.each(function(name, tab) {
      t.push([name, tab]);
    });

    expect(t.length).toEqual(2);
    expect(t[0][0]).toEqual('tab1')
    expect(t[1][0]).toEqual('tab2')
    expect(t[0][1].cid).toEqual(v1.cid);
    expect(t[1][1].cid).toEqual(v2.cid);

  });


  it("user after option inserting view after specified index", function() {
    var v1, v2, v3;
    v1 = new cdb.core.View(),
    v2 = new cdb.core.View();
    v3 = new cdb.core.View();
    pane.addTab('tab1', v1);
    pane.addTab('tab2', v2);
    pane.addTab('tab3', v3, { after: 0 });
    expect(pane.$el.children()[0]).toEqual(v1.el);
    expect(pane.$el.children()[1]).toEqual(v3.el);
    expect(pane.$el.children()[2]).toEqual(v2.el);
  });

  it("clean should remove all tabs", function() {
    spyOn(pane, "removeTabs");
    pane.clean();
    expect(pane.removeTabs).toHaveBeenCalled();

  });

});
