describe("tabs", function() {

  var view;
  beforeEach(function() {
    view = new cdb.admin.Tabs({
      el: $('<div>')
    });
    view.$el.append('<a href="#t1"></a>');
    view.$el.append('<a href="#t2"></a>');

  });

  it("should trigger click with tab name", function() {
    var name;
    view.bind('click', function(n) {
      name = n;
    });
    $(view.$el.children()[0]).trigger('click')
    expect(name).toEqual('t1');
    expect(view.preventDefault).toEqual(false);
  });

  it("should enable panel view when s linked", function() {
    var panel = new cdb.ui.common.TabPane();
    panel.addTab('t1', new cdb.core.View());
    panel.addTab('t2', new cdb.core.View());
    panel.active('t2');
    view.linkToPanel(panel);
    var a_t1 = $(view.$el.children()[0])
    var a_t2 = $(view.$el.children()[1])
    a_t1.trigger('click')
    expect(panel.activeTab).toEqual('t1');

    expect(a_t1.hasClass('selected')).toEqual(true);
    panel.active('t2');
    expect(a_t1.hasClass('selected')).not.toEqual(true);
    expect(a_t2.hasClass('selected')).toEqual(true);

    expect(view.preventDefault).toEqual(true);

  });

});
