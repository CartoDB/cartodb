const Backbone = require('backbone');
const IconModel = require('dashboard/views/organization/icon-picker/icons/organization-icon-model');

const configModel = require('fixtures/dashboard/config-model.fixture');

describe('organization/icon-picker/icons/organization-icon-model', function () {
  it('should have defaults to false', function () {
    const model = new IconModel({}, { configModel });

    expect(model.attributes).toEqual({
      selected: false,
      visible: false,
      deleted: false
    });
    expect(model.fileAttribute).toEqual('resource');
  });

  it('save should not serialize only UI attributes', function () {
    spyOn(Backbone.Model.prototype, 'save');
    const model = new IconModel({
      garrafa: 'XXL'
    }, { configModel });

    expect(model.attributes.selected).toBeDefined();
    expect(model.attributes.visible).toBeDefined();
    expect(model.attributes.deleted).toBeDefined();

    model.save();

    const saveCall = Backbone.Model.prototype.save.calls.mostRecent();
    expect(saveCall.args[0].garrafa).toBeDefined();
    expect(saveCall.args[0].selected).not.toBeDefined();
    expect(saveCall.args[0].visible).not.toBeDefined();
    expect(saveCall.args[0].deleted).not.toBeDefined();
  });
});
