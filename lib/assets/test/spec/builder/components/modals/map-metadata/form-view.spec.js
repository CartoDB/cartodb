var Backbone = require('backbone');
var FormView = require('builder/components/modals/map-metadata/form/form-view');

describe('components/modals/map-metadata/form-view', function () {
  beforeEach(function () {
    this.view = new FormView({
      visDefinitionModel: new Backbone.Model(),
      visMetadataModel: new Backbone.Model()
    });
    this.view.model = {};
  });

  it('._commitView should call _sanitizeName', function () {
    spyOn(this.view, '_sanitizeName');
    var name = 'something';
    var view = {
      model: {
        changed: {name: name},
        get: function () {
          return name;
        }
      },
      commit: function () {}
    };

    this.view._commitView(view);

    expect(this.view._sanitizeName).toHaveBeenCalledWith(name);
  });

  it('._sanitizeName should sanitize input and set metadata model name', function () {
    this.view._sanitizeName('<script>');
    expect(this.view._visMetadataModel.get('name')).toEqual('');

    this.view._sanitizeName('something');
    expect(this.view._visMetadataModel.get('name')).toEqual('something');

    this.view._sanitizeName(null);
    expect(this.view._visMetadataModel.get('name')).toEqual('');
  });
});
