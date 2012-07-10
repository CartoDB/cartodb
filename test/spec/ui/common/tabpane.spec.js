describe('core.ui.common.TabPane', function() {

    var pane;
    beforeEach(function() {
        pane = new cdb.ui.common.TabPane();
    });

    it("should add a pane", function() {
        spy = {
          tabAdded: function(){}
        };
        spyOn(spy, 'tabAdded');
        var v1 = new cdb.core.View();
        pane.bind('tabAdded', spy.tabAdded, spy);
        pane.addTab('tab1', v1);
        expect(pane._subviews[v1.cid]).toBeTruthy();
        expect(pane.activeTab).toEqual('tab1');
        expect(pane.$el.children()[0]).toEqual(v1.el);
        expect(spy.tabAdded).toHaveBeenCalledWith('tab1', v1);
    });

    it("should remove a pane", function() {
        var v1 = new cdb.core.View();
        var v2 = new cdb.core.View();
        pane.addTab('tab1', v1);
        pane.addTab('tab2', v2);
        pane.active('tab1');
        pane.removeTab('tab1');
        expect(pane._subviews[v1.cid]).toBeFalsy();
        expect(pane.activeTab).toEqual('tab2');
        //only one children
        expect(pane.$el.children()[0]).toEqual(v2.el);
        expect(pane.$el.children().length).toEqual(1);
    });

    it("should trigger on activate", function() {
        spy = {
          tabEnabled: function(){},
          tabDisabled: function(){}
        };

        spyOn(spy, 'tabDisabled');
        spyOn(spy, 'tabEnabled');
        var v1 = new cdb.core.View();
        var v2 = new cdb.core.View();
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
