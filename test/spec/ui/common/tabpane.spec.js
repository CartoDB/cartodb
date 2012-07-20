describe('core.ui.common.TabPane', function() {

  var pane;

  beforeEach(function() {
    pane = new cdb.ui.common.TabPane();
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
});
