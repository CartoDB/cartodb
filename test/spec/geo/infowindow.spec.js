
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

    it("should save and restore fields", function() {
      model.addField('test', 1);
      model.addField('test2', 0);
      model.addField('test3', 3);
      model.saveFields();
      expect(model.get('old_fields')).toEqual(model.get('fields'));
      model.clearFields();
      model.restoreFields();
      expect(model.get('old_fields')).toEqual(undefined);
      expect(model.get('fields')[0].name).toEqual('test2');
      expect(model.get('fields')[1].name).toEqual('test');
      expect(model.get('fields')[2].name).toEqual('test3');
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

      model = new cdb.geo.ui.InfowindowModel({
        fields: [
          { name: 'test1', position: 1, title: true},
          { name: 'test2', position: 2, title: true}
        ]
      });

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

    it("should convert value to string when it is a number", function() {
      model.set('content', { fields: [{ title: 'jamon1', value: 0}, { title: 'jamon2', value: 1}] }, {silent: true});

      var render_fields = view._fieldsToString(model.attributes).content.fields;

      expect(render_fields[0].value).toEqual("0");
      expect(render_fields[1].value).toEqual("1");
    });

    it("should convert value to null when it is undefined", function() {
      model.set('content', { fields: [{ title: 'jamon', value: undefined}] }, {silent: true});

      var render_fields = view._fieldsToString(model.attributes).content.fields;
      expect(render_fields[0].value).toEqual(null);
    });

    it("should convert value to null when it is null", function() {
      model.set('content', { fields: [{ title: 'jamon', value: null}] }, {silent: true});

      var render_fields = view._fieldsToString(model.attributes).content.fields;
      expect(render_fields[0].value).toEqual(null);
    });

    it("should convert value to null when it is empty", function() {
      model.set('content', { fields: [{ title: 'jamon', value: ''}] }, {silent: true});

      var render_fields = view._fieldsToString(model.attributes).content.fields;
      expect(render_fields[0].value).toEqual(null);
    });

    it("should leave a string as it is", function() {
      model.set('content', { fields: [{ title: 'jamon', value: "jamon is testing"}] }, {silent: true});

      var render_fields = view._fieldsToString(model.attributes).content.fields;
      expect(render_fields[0].value).toEqual("jamon is testing");
    });

    it("should convert value to string when it is a boolean", function() {
      model.set('content', { fields: [{ title: 'jamon1', value: false}, { title: 'jamon2', value: true}] }, {silent: true});

      var render_fields = view._fieldsToString(model.attributes).content.fields;

      expect(render_fields[0].value).toEqual("false");
      expect(render_fields[1].value).toEqual("true");
    });

    it("should be null when there isn't any field", function() {
      spyOn(view, 'render');
      model.set('fields', []);
      expect(view.render).not.toHaveBeenCalled();
      expect(view.$el.html()).toEqual('');
    });

  });


  describe("image template", function() {
    var model, view, container, fields, fields2;

    beforeEach(function() {

      container = $('<div>').css('height', '200px');

      fields = [
        { name: 'test1', position: 1, title: true, value: "http://assets.javierarce.com/lion.png" },
        { name: 'test2', position: 2, title: true, value: "b"}
      ];

      fields2 = [
        { name: 'test1', position: 1, title: true, value: "x" },
        { name: 'test2', position: 2, title: true, value: "b"}
      ];

      map = new cdb.geo.Map();

      mapView = new cdb.geo.MapView({
        el: container,
        map: map
      });

      model = new cdb.geo.ui.InfowindowModel({
        content: {
        fields: fields
        }
      });

      view = new cdb.geo.ui.Infowindow({
        model: model,
        mapView: mapView
      });

    });

    it("should get the cover url", function() {
      expect(view._getCoverURL()).toEqual("http://assets.javierarce.com/lion.png");
    });

    it("should validate the cover url", function() {
      var url = view._getCoverURL();
      expect(view._isValidURL(url)).toEqual(true);
    });

    it("should append the image", function() {
      model.set('template', '<div class="cover"></div>');
      expect(view.$el.find("img").length).toEqual(1);
    });

    it("if the image is invalid it shouldn't append it", function() {
      model.set("content", { fields: fields2 });
      model.set('template', '<div class="cover"></div>');
      expect(view.$el.find("img").length).toEqual(0);
    });

  });

});
