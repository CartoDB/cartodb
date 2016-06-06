var cdb = require('cartodb.js');
var Notifier = require('../../../../../../javascripts/cartodb3/editor/components/notifier/notifier.js');

describe('editor/components/notifier/notifier', function () {
  it('should return the view properly', function () {
    expect(Notifier.getView({
      editorModel: new cdb.core.Model()
    })).toBeDefined();
  });

  it('should render properly', function () {
    expect(Notifier.getView({
      editorModel: new cdb.core.Model()
    }).render().el).toBeDefined();
  });
});
