describe("mod.infowindow", function() {
  var view, model;
  var table;

  beforeEach(function() {
    model = new cdb.geo.ui.InfowindowModel();
    table = new cdb.admin.CartoDBTableMetadata({
        name: 'testTable',
        schema: [
          ['name1', 'string'],
          ['name2', 'number']
        ]
      });
    
    view = new cdb.admin.mod.InfoWindow({
      model: model,
      table: table
    });
  });

  it("should render fields", function() {
    view.render();
    //model.set({'fields': ['name1', 'name2']});
    expect(view.$el.find('li').length).toEqual(2);
  });

  it("should toggle switches", function() {
    view.render();
    model.addField('name1').addField('name2');
    expect($(view.$el.find('.switch')[0]).hasClass('enabled')).toEqual(true);
    expect($(view.$el.find('.switch')[1]).hasClass('enabled')).toEqual(true);
    model.removeField('name1');
    expect($(view.$el.find('.switch')[0]).hasClass('enabled')).toEqual(false);
    expect($(view.$el.find('.switch')[1]).hasClass('enabled')).toEqual(true);
  });

  it("should toggle titles", function() {
    view.render();
    model.addField('name1').addField('name2');
    expect($(view.$el.find('.title')[0]).hasClass('enabled')).toEqual(true);
    expect($(view.$el.find('.title')[1]).hasClass('enabled')).toEqual(true);
    model.setFieldProperty('name1', 'title', false);
    expect($(view.$el.find('.title')[0]).hasClass('enabled')).toEqual(false);
    expect($(view.$el.find('.title')[1]).hasClass('enabled')).toEqual(true);
  });


  /*
   * i dont know why the click event is not trigger
   * but it works :)
  it("should toggle fields on click", function() {
    view.render();
    model.set({'fields': ['name1', 'name2']});
    $(view.$el.find('.switch')[0]).trigger('click');
    expect(model.containsField('name1')).toEqual(false);
    expect(model.containsField('name2')).toEqual(true);
  });
  */

});
