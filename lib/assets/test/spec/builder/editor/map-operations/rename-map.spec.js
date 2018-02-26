var VisDefinitionModel = require('builder/data/vis-definition-model');
var ConfigModel = require('builder/data/config-model');
var renameMap = require('builder/editor/map-operations/rename-map');

describe('editor/map-operations/rename-map', function () {
  var visDefinitionModel;
  var successSaveSpy;
  var errorSaveSpy;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'LINK',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      tags: ['foo', 'bar'],
      permission: {}
    }, {
      configModel: configModel
    });

    successSaveSpy = jasmine.createSpy('successSave');
    errorSaveSpy = jasmine.createSpy('erroSave');
    spyOn(visDefinitionModel, 'save');
  });

  it('should rename document title and the suffix should contain | CARTO', function () {
    renameMap({
      onSuccess: successSaveSpy,
      onError: errorSaveSpy,
      visDefinitionModel: visDefinitionModel,
      newName: 'Wadus',
      description: 'Wadus',
      tags: ['foo', 'bar']
    });

    expect(visDefinitionModel.save).toHaveBeenCalled();
    visDefinitionModel.save.calls.argsFor(0)[1].success();

    expect(successSaveSpy).toHaveBeenCalled();
    expect(document.title).not.toMatch(/CartoDB/);
    expect(document.title).toBe('Wadus | CARTO');
  });
});
