
describe("cdb.geo.ui.infowindow", function() {

  describe("model", function() {
    var model;
    beforeEach(function() {
      model = new cdb.geo.ui.InfowindowModel();
    });

    it("should add a field", function() {
      expect(model.containsField('test')).toEqual(false);
      model.addField('test');
      model.addField('test2');
      expect(model.containsField('test')).toEqual(true);
      model.removeField('test');
      expect(model.containsField('test')).toEqual(false);
      expect(model.containsField('test2')).toEqual(true);
      model.clearFields();
      expect(model.containsField('test2')).toEqual(false);
    });

    it("should add a field in order", function() {
      model.addField('test', 1);
      model.addField('test2', 0);
      expect(model.get('fields')[0].name).toEqual('test2');
      expect(model.get('fields')[1].name).toEqual('test');
    });

    it("should allow modify field properties", function() {
      var spy = sinon.spy();
      model.addField('test');
      var t = model.getFieldProperty('test', 'title');
      expect(t).toEqual(true);
      model.bind('change:fields', spy);
      expect(spy.called).toEqual(false);
      model.setFieldProperty('test', 'title', false);
      t = model.getFieldProperty('test', 'title');
      expect(t).toEqual(false);
      expect(spy.called).toEqual(true);
    });
  });

  describe("view", function() {
    var model, view;
    beforeEach(function() {
      var container = $('<div>').css('height', '200px');
      map = new cdb.geo.Map();
      mapView = new cdb.geo.MapView({
        el: container,
        map: map
      });
      model = new cdb.geo.ui.InfowindowModel();
      view = new cdb.geo.ui.Infowindow({
        model: model,
        mapView: mapView
      });
    });

    it("should add render when template changes", function() {
      spyOn(view, 'render');
      model.set('template', 'jaja');
      expect(view.render).toHaveBeenCalled()
    });

  });


});

