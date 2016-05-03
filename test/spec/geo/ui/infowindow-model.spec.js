var InfowindowModel = require('../../../../src/geo/ui/infowindow-model');

describe('geo/ui/infowindow-model', function () {
  describe('.setContent', function () {
    it('should only include empty fields when no attributes are given', function () {
      var infowindowModel = new InfowindowModel({ fields: [ { name: 'NAME' } ], show_empty_fields: false });
      infowindowModel.updateContent();

      expect(infowindowModel.get('content').fields).toEqual([ { title: null, value: '&nbsp;', index: 0 } ]);

      var infowindowModel = new InfowindowModel({ fields: [ { name: 'NAME' } ], show_empty_fields: true });
      infowindowModel.updateContent();

      expect(infowindowModel.get('content').fields).toEqual([ { title: null, value: '&nbsp;', index: 0 } ]);
    });

    it('should show empty fields', function () {
      var infowindowModel = new InfowindowModel({ fields: [{ name: 'NAME', title: true }, { name: 'SOMETHING', title: true }], show_empty_fields: false });
      infowindowModel.updateContent({ NAME: 'CartoDB' });

      expect(infowindowModel.get('content').fields).toEqual([{ title: 'NAME', value: 'CartoDB', index: 0 }]);
    });

    it('should not show empty fields', function () {
      var infowindowModel = new InfowindowModel({ fields: [{ name: 'NAME', title: true }, { name: 'SOMETHING', title: true }], show_empty_fields: true });
      infowindowModel.updateContent({ NAME: 'CartoDB' });

      expect(infowindowModel.get('content').fields).toEqual([{ title: 'NAME', value: 'CartoDB', index: 0 }, { title: 'SOMETHING', value: '-', index: 1 }]);
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

    it('should return empty fields and use the given placeholder', function () {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var options = { show_empty_fields: true, placeholder: '-' };
      var content = InfowindowModel.contentForFields(attributes, fields, options);

      expect(content.fields.length).toEqual(2);
      expect(content.fields[0]).toEqual({
        title: null,
        value: 'value1',
        index: 0
      });
      expect(content.fields[1]).toEqual({
        title: null,
        value: '-',
        index: 1
      });
    });

    it('should not return empty fields', function () {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var options = { show_empty_fields: false };
      var content = InfowindowModel.contentForFields(attributes, fields, options);

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0]).toEqual({
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
});
