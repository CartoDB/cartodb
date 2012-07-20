describe("mod.infowindow", function() {
  var view, model;

  beforeEach(function() {
    cdb.templates.add(new cdb.core.Template({
      name: 'table/menu_modules/views/infowindow',
      compiled: _.template('<ul class="fields"> </ul>')
    }));
    model = new cdb.geo.ui.InfowindowModel();
    view = new cdb.admin.mod.InfoWindow({
      model: model
    });
  });

  it("should render fields", function() {
    view.render();
    model.set({'fields': ['name1', 'name2']});
    expect(view.$el.find('li').length).toEqual(2);
  });

  it("should toggle fields", function() {
    view.render();
    model.set({'fields': ['name1', 'name2']});
    expect($(view.$el.find('li')[0]).hasClass('enabled')).toEqual(true);
    model.bind('change:fields', function() {
      console.log(model.attributes.fields);
    });
    model.removeField('name1');
    expect($(view.$el.find('li')[0]).hasClass('enabled')).toEqual(false);
  });

  it("should toggle fields on click", function() {
    view.render();
    model.set({'fields': ['name1', 'name2']});
    $(view.$el.find('li')[0]).trigger('click');
    expect(model.containsField('name1')).toEqual(false);
  });

});
