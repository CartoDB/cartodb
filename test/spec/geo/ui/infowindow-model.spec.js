var InfowindowModel = require('../../../../src/geo/ui/infowindow-model');
var InfowindowTemplate = require('../../../../src/geo/map/infowindow-template');

describe('geo/ui/infowindow-model', function () {
  it('should set a default template if template is empty', function () {
    var infowindowModel = new InfowindowModel({});

    expect(infowindowModel.get('template')).toEqual(infowindowModel.DEFAULT_TEMPLATE);

    infowindowModel = new InfowindowModel({ template: '' });

    expect(infowindowModel.get('template')).toEqual(infowindowModel.DEFAULT_TEMPLATE);

    infowindowModel = new InfowindowModel({ template: ' ' });

    expect(infowindowModel.get('template')).toEqual(infowindowModel.DEFAULT_TEMPLATE);
  });

  it('should NOT set a default template if template is present', function () {
    var infowindowModel = new InfowindowModel({ template: 'template' });

    expect(infowindowModel.get('template')).toEqual('template');
  });

  describe('.setContent', function () {
    it('should NOT include empty fields', function () {
      var infowindowModel = new InfowindowModel({ fields: [{ name: 'NAME', title: true }, { name: 'SOMETHING', title: true }] });
      infowindowModel.updateContent({ NAME: 'CartoDB' }, { showEmptyFields: false });

      expect(infowindowModel.get('content').fields).toEqual([{ name: 'NAME', title: 'NAME', value: 'CartoDB', index: 0 }]);
    });

    it('should include empty fields', function () {
      var infowindowModel = new InfowindowModel({ fields: [{ name: 'NAME', title: true }, { name: 'SOMETHING', title: true }] });
      infowindowModel.updateContent({ NAME: 'CartoDB' }, { showEmptyFields: true });

      expect(infowindowModel.get('content').fields).toEqual([{ name: 'NAME', title: 'NAME', value: 'CartoDB', index: 0 }, { name: 'SOMETHING', title: 'SOMETHING', value: null, index: 1 }]);
    });
  });

  describe('.contentForFields', function () {
    it('should return the title and value of each field', function () {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1', title: true }];
      var content = InfowindowModel.contentForFields(attributes, fields, {});

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0].title).toEqual('field1');
      expect(content.fields[0].value).toEqual('value1');
    });

    it('should not return the title if not specified', function () {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }]; // Field doesn't have a title attribute
      var content = InfowindowModel.contentForFields(attributes, fields, {});

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0].title).toEqual(null);
    });

    it('should return the index of each field', function () {
      var attributes = { field1: 'value1', field2: 'value2' };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var content = InfowindowModel.contentForFields(attributes, fields, {});

      expect(content.fields.length).toEqual(2);
      expect(content.fields[0].index).toEqual(0);
      expect(content.fields[1].index).toEqual(1);
    });

    it('should return empty fields', function () {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var options = { showEmptyFields: true };
      var content = InfowindowModel.contentForFields(attributes, fields, options);

      expect(content.fields.length).toEqual(2);
      expect(content.fields[0]).toEqual({
        name: 'field1',
        title: null,
        value: 'value1',
        index: 0
      });
      expect(content.fields[1]).toEqual({
        name: 'field2',
        title: null,
        value: null,
        index: 1
      });
    });

    it('should not return empty fields', function () {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var options = { showEmptyFields: false };
      var content = InfowindowModel.contentForFields(attributes, fields, options);

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0]).toEqual({
        name: 'field1',
        title: null,
        value: 'value1',
        index: 0
      });
    });

    it('should not return fields with a null value', function () {
      var attributes = { field1: 'wadus', field2: null };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var content = InfowindowModel.contentForFields(attributes, fields, {});

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0]).toEqual({
        name: 'field1',
        title: null,
        value: 'wadus',
        index: 0
      });
    });

    it('should return the attributes as data', function () {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }];
      var content = InfowindowModel.contentForFields(attributes, fields, {});

      expect(content.data).toEqual(attributes);
    });

    it('should return an empty field when no data is available', function () {
      var attributes = {};
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var content = InfowindowModel.contentForFields(attributes, fields, {});

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0]).toEqual({
        title: null,
        value: 'No data available',
        index: 0,
        type: 'empty'
      });
    });
  });

  describe('.setInfowindowTemplate', function () {
    it('should only pick and set specific attributes from the given template', function () {
      var infowindowModel = new InfowindowModel({ template: 'template' });
      infowindowModel.setInfowindowTemplate(new InfowindowTemplate({
        template: 'new_template',
        something: 'something'
      }));

      expect(infowindowModel.get('template')).toEqual('new_template');
      expect(infowindowModel.get('something')).toBeUndefined();
    });

    it('should reject attributes from the template that have a falsy value', function () {
      var infowindowModel = new InfowindowModel({ template: 'template' });
      infowindowModel.setInfowindowTemplate(new InfowindowTemplate({
        template: ''
      }));

      // Attributes have NOT changed
      expect(infowindowModel.get('template')).toEqual('template');

      infowindowModel.setInfowindowTemplate(new InfowindowTemplate({
        template: 'new_template'
      }));

      // Atributtes have changed
      expect(infowindowModel.get('template')).toEqual('new_template');
    });
  });
});
