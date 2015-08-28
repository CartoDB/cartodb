
describe("right menu", function() {
  var view;
  beforeEach(function() {
    cdb.templates.add(new cdb.core.Template({
      name: 'table/views/right_panel',
      compiled: _.template(
      '<section class="table_panel">' + 
        '<div class="layer-sidebar">' + 
          '<nav class="tools">' + 
          '</nav>' +
          '<nav class="edit">' +
          '</nav>' +
        '</div>' + 
        '<div class="layer-views">' +
        '</div>' +
      '</section>'
      )
    }));
    view = new cdb.admin.RightMenu();
  });

  it("should render", function() {
    var el = view.render().$el;
    expect(el.find('.layer-sidebar')).toBeTruthy();
    expect(el.find('.layer-views')).toBeTruthy();
  });

  it("should add view and a button", function() {
    var v = new cdb.core.View();
    v.buttonClass = 'testButtonClass';
    v.type = 'tool';
    view.render();
    view.addModule(v);
    expect(view.$el.find('.layer-views').children().length).toEqual(1);
    expect(view.$el.find('.tools').children().length).toEqual(1);
  });

  it("should activate right panel and add a selected class in the button", function() {
    var v = new cdb.core.View();
    v.buttonClass = 'testButtonClass';
    v.type = 'tool';
    view.render();
    view.addModule(v);

    var v2 = new cdb.core.View();
    v2.buttonClass = 'testButtonClass2';
    v2.type = 'tool';
    view.addModule(v2);

    expect(view.panels.activeTab).toEqual('testButtonClass2');

    view.$('.layer-sidebar .testButtonClass').trigger('click');

    expect(view.panels.activeTab).toEqual('testButtonClass');

    //expect(view.buttons[0].$el.attr('class')).toEqual('testButtonClass selected');
  });


  it("should hide tools related to a section and remove selected class in the button", function() {
    var v = new cdb.core.View();
    v.buttonClass = 'testButtonClass';
    v.type = 'tool';
    view.render();
    view.addModule(v, 'table');

    var v2 = new cdb.core.View();
    v2.buttonClass = 'testButtonClass2';
    v2.type = 'tool';
    view.addModule(v2, 'map');

    view.showTools('map');
    expect(view.buttons[0].$el.css('display')).toEqual('none');
    view.showTools('table');
    expect(view.buttons[0].$el.css('display')).not.toEqual('none');

    expect(view.buttons[0].$el.attr('class')).toEqual('testButtonClass');
  });

  it("should hide tool on add if the section is disabled", function() {
    var v = new cdb.core.View();
    v.buttonClass = 'testButtonClass';
    v.type = 'tool';
    view.render();
    view.addModule(v, 'table');

    view.showTools('table');

    var v2 = new cdb.core.View();
    v2.buttonClass = 'testButtonClass2';
    v2.type = 'tool';
    view.addModule(v2, 'map');

    expect(view.buttons[0].$el.css('display')).not.toEqual('none');
    expect(view.buttons[1].$el.css('display')).toEqual('none');
  });

  it("should add tool buttons", function() {
    view.render();
    var b = view.addToolButton('testing', 'table');
    view.addToolButton('testing2', 'map');
    expect(view.buttons[0].className).toEqual('testing');
    expect(view.buttons[0]).toEqual(b);
    view.showTools('map');
    view.addToolButton('testing3', 'table');
    expect(view.buttons[0].$el.css('display')).toEqual('none');
    expect(view.buttons[1].$el.css('display')).not.toEqual('none');
    expect(view.buttons[2].$el.css('display')).toEqual('none');
  });

  it("should not have leaks", function() {
    expect(view).toHaveNoLeaks();
  });
});
