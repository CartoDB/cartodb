var Backbone = require('backbone');
var DatasetMetadataView = require('builder/components/modals/dataset-metadata/dataset-metadata-view');

describe('components/modals/dataset-metadata/dataset-metadata-view', function () {
  beforeEach(function () {
    this.view = new DatasetMetadataView({
      modalModel: new Backbone.Model(),
      configModel: new Backbone.Model(),
      visDefinitionModel: new Backbone.Model(),
      isLocked: false
    });
  });

  it('._getMetadataName sanitizes input', function () {
    this.view._visMetadataModel.set('name', "><script>alert('yep');</script>");

    var name = this.view._getMetadataName();

    expect(name).toEqual('&gt;');
  });

  it('._getMetadataDescription sanitizes input', function () {
    this.view._visMetadataModel.set('description', "<img src='http://emojipedia-us.s3.amazonaws.com/cache/b8/b4/b8b4e86a110557e6b6d666c9cf6d6cc8.png' />");

    var name = this.view._getMetadataDescription();

    expect(name).toEqual('<img>');
  });

  it('._getMetadataTags sanitizes input', function () {
    this.view._visMetadataModel.set('tags', [
      "<img src='http://emojipedia-us.s3.amazonaws.com/cache/b8/b4/b8b4e86a110557e6b6d666c9cf6d6cc8.png' />",
      "><script>alert('yep');</script>"
    ]);

    var tags = this.view._getMetadataTags();

    expect(tags.length).toBe(2);
    expect(tags[0]).toEqual('<img>');
    expect(tags[1]).toEqual('&gt;');
  });
});
