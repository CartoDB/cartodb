var Backbone = require('backbone-cdb-v3');
var IconModel = require('../../../../../../javascripts/cartodb/organization/icon_picker/icons/organization_icon_model');

describe('organization/icon_picker/icons/organization_icon_model', function () {
  it('should have defaults to false', function () {
    var model = new IconModel();

    expect(model.attributes).toEqual({
      selected: false,
      visible: false,
      deleted: false
    });
    expect(model.fileAttribute).toEqual('resource');
  });

  it('save should not serialize only UI attributes', function () {
    spyOn(Backbone.Model.prototype, 'save');
    var model = new IconModel({
      garrafa: 'XXL'
    });

    expect(model.attributes.selected).toBeDefined();
    expect(model.attributes.visible).toBeDefined();
    expect(model.attributes.deleted).toBeDefined();

    model.save();

    var saveCall = Backbone.Model.prototype.save.calls.mostRecent();
    expect(saveCall.args[0].garrafa).toBeDefined();
    expect(saveCall.args[0].selected).not.toBeDefined();
    expect(saveCall.args[0].visible).not.toBeDefined();
    expect(saveCall.args[0].deleted).not.toBeDefined();
  });
});
