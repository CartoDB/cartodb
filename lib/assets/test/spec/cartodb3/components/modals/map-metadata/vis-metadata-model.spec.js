var Backbone = require('backbone');
var VisMetadataModel = require('../../../../../../javascripts/cartodb3/components/modals/map-metadata/vis-metadata-model');

describe('components/modals/map-metadata/vis-metadata-model', function () {
  beforeEach(function () {
    this.visDefinitionModel = new Backbone.Model({
      name: 'Foo',
      description: 'Bar',
      tags: ['lol', 'osom']
    });

    this.model = new VisMetadataModel({}, {
      visDefinitionModel: this.visDefinitionModel
    });
  });

  it('should map visDefinitionModel attributes', function () {
    expect(this.model.get('name')).toEqual('Foo');
    expect(this.model.get('description')).toEqual('Bar');
    expect(this.model.get('tags')).toEqual(['lol', 'osom']);
  });

  it('should validate propely', function () {
    this.model.set({name: ''});
    expect(this.model.isValid()).toBe(false);
  });
});
