describe("tabs", function() {

  var view;
  beforeEach(function() {
    view = new cdb.admin.Tabs({
      el: $('<div>')
    });
    view.$el.append('<span></span>');
    view.$el.find('span').append('<a href="#t1">pene<div class="name">hola</div></a>');
    view.$el.find('span').append('<a href="#t2"></a>');

  });

  it("should trigger click with tab name", function() {
    var name;
    view.bind('click', function(n) {
      name = n;
    });
    $(view.$el.find('span').children()[0]).trigger('click')
    expect(name).toEqual('t1');
    expect(view.preventDefault).toEqual(false);
  });

  it("should trigger click with tab name although is clicking over a div", function() {
    var name;
    view.bind('click', function(n) {
      name = n;
    });
    $(view.$el.find('span:eq(0) a div')).trigger('click')
    expect(name).toEqual('t1');
    expect(view.preventDefault).toEqual(false);
  });

  it("should enable panel view when s linked", function() {
    var panel = new cdb.ui.common.TabPane();
    panel.addTab('t1', new cdb.core.View());
    panel.addTab('t2', new cdb.core.View());
    panel.active('t2');
    view.linkToPanel(panel);
    var a_t1 = $(view.$el.find('span').children()[0])
    var a_t2 = $(view.$el.find('span').children()[1])
    a_t1.trigger('click')
    expect(panel.activeTab).toEqual('t1');

    expect(a_t1.hasClass('selected')).toEqual(true);
    panel.active('t2');
    expect(a_t1.hasClass('selected')).not.toEqual(true);
    expect(a_t2.hasClass('selected')).toEqual(true);

    expect(view.preventDefault).toEqual(true);
  });

  it("should disable all the links when disableAll is called", function() {
    view.disableAll();
    expect(view.$('a').length).toEqual(2);
    expect(view.$('a').eq(0).hasClass('disabled')).toBeTruthy();
    expect(view.$('a').eq(1).hasClass('disabled')).toBeTruthy();
  })

  it("should remove a disabled panel view when removeDisabled is called", function() {
    view.disableAll();
    view.removeDisabled();
    expect(view.$el.find('span').length).toBeFalsy();
  })
});
