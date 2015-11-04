var $ = require('jquery');
var InfowindowModel = require('cdb/geo/ui/infowindow-model');

describe('geo/ui/infowindow-model', function() {
  var model;

  beforeEach(function() {
    model = new InfowindowModel();
  });

  it("should allow adding an alternative name", function() {
    model.addField('the_name');
    model.addField('the_description');

    model.setAlternativeName('the_name', 'nombre');
    model.setAlternativeName('the_description', 'descripción');

    n = model.getAlternativeName('the_name');
    d = model.getAlternativeName('the_description');

    expect(n).toEqual("nombre");
    expect(d).toEqual("descripción");

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
    var spy = jasmine.createSpy('change:fields');
    model.addField('test');
    var t = model.getFieldProperty('test', 'title');
    expect(t).toEqual(true);
    model.bind('change:fields', spy);
    expect(spy).not.toHaveBeenCalled();
    model.setFieldProperty('test', 'title', false);
    t = model.getFieldProperty('test', 'title');
    expect(t).toEqual(false);
    expect(spy).toHaveBeenCalled();
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

  describe(".contentForFields", function() {

    it('should return the title and value of each field', function() {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1', title: true }];
      var content = InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0].title).toEqual('field1');
      expect(content.fields[0].value).toEqual('value1');
    });

    it('should not return the title if not specified', function() {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }]; // Field doesn't have a title attribute
      var content = InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0].title).toEqual(null);
    });

    it('should return the index of each field', function() {
      var attributes = { field1: 'value1', field2: 'value2' };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var content = InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.fields.length).toEqual(2);
      expect(content.fields[0].index).toEqual(0);
      expect(content.fields[1].index).toEqual(1);
    });

    it('should return empty fields', function() {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var options = { empty_fields: true };
      var content = InfowindowModel.contentForFields(attributes, fields, options)

      expect(content.fields.length).toEqual(2);
      expect(content.fields[0]).toEqual({
        title: null,
        value: 'value1',
        index: 0
      });
      expect(content.fields[1]).toEqual({
        title: null,
        value: undefined,
        index: 1
      });
    });

    it('should not return empty fields', function() {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var options = { empty_fields: false };
      var content = InfowindowModel.contentForFields(attributes, fields, options)

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0]).toEqual({
        title: null,
        value: 'value1',
        index: 0
      });
    });

    it('should not return fields with a null value', function() {
      var attributes = { field1: 'wadus', field2: null };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var content = InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0]).toEqual({
        title: null,
        value: 'wadus',
        index: 0
      });
    });

    it('should return the attributes as data', function() {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }];
      var content = InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.data).toEqual(attributes);
    });

    it('should return an empty field when no data is available', function() {
      var attributes = {};
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var content = InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0]).toEqual({
        title: null,
        value: 'No data available',
        index: 0,
        type: 'empty'
      });
    });
  });
});
