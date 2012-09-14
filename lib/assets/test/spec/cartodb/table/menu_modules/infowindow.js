describe("mod.infowindow", function() {
  var view, model;
  var table;

  beforeEach(function() {
    model = new cdb.geo.ui.InfowindowModel();
    table = new cdb.admin.CartoDBTableMetadata({
        name: 'testTable',
        schema: [
          ['name1', 'string'],
          ['name2', 'number'],
          ['name3', 'number']
        ]
      });

    view = new cdb.admin.mod.InfoWindow({
      el: $('<div>'),
      model: model,
      table: table
    });
  });

  it("should render fields", function() {
    view.render();
    //model.set({'fields': ['name1', 'name2']});
    expect(view.$el.find('li').length).toEqual(3 + 1);// 2 fields + theme field
  });

  it("should render theme combo", function() {
    view.render();
    expect(view.$el.find('select').length).toEqual(1);// theme field
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

  it("should enable select-all", function() {
    view.render();
    model.addField('name1').addField('name2').addField('name3');
    expect($(view.$el.find('.selectall')[0]).hasClass('enabled')).toEqual(true);
  });

  it("should disable select-all", function() {
    view.render();
    model.addField('name1').addField('name2').addField('name3');
    expect($(view.$el.find('.selectall')[0]).hasClass('enabled')).toEqual(true);
    model.removeField('name1');
    expect($(view.$el.find('.selectall')[0]).hasClass('disabled')).toEqual(true);
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

  it("should toggle fields on click", function() {
      view.render();
      model.addField('name1').addField('name2');
      $(view.$el.find('.switch')[0]).trigger('click');
      expect(model.containsField('name1')).toEqual(false);
      expect(model.containsField('name2')).toEqual(true);
  });

  it("should be placed in order", function() {
      view.render();
      model.addField('name1', 0).addField('name2', 1);
      var first = view.$el.find('.drag_field')[0];
      //move to last
      view.$el.append(first);
      view._reasignPositions();
      //$(view.$el.find('.switch')[1]).trigger('click');
      //$(view.$el.find('.switch')[0]).trigger('click');
      var fields = model.get('fields');
      expect(fields[0].name).toEqual('name2');
      expect(fields[1].name).toEqual('name1');

  });


});
