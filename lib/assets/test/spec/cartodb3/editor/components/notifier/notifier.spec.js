var Notifier = require('../../../../../../javascripts/cartodb3/editor/components/notifier/notifier.js');
var Backbone = require('backbone');

describe('editor/components/notifier/notifier', function () {
  var model;
  var editorModel;

  beforeAll(function () {
    editorModel = new Backbone.Model();
  });

  beforeEach(function () {
    Notifier.init({
      editorModel: editorModel
    });

    model = Notifier.addNotification({
      id: 'whatever'
    });
  });

  afterEach(function () {
    Notifier.getCollection().reset();
  });

  it('should return the view properly', function () {
    expect(Notifier.getView()).toBeDefined();
  });

  it('should render properly', function () {
    expect(Notifier.getView().render().el).toBeDefined();
  });

  it('should return the proper model', function () {
    var model = Notifier.addNotification({
      id: 'foo'
    });
    expect(model.get('id')).toBe('foo');
    expect(Notifier.getCollection().length).toBe(2);
  });

  it('should search model properly', function () {
    var result = Notifier.getNotification('whatever');
    expect(result).toBe(model);

    var result2 = Notifier.getNotification(model);
    expect(result2).toBe(model);
  });

  it('should remove notification properly', function () {
    var result = Notifier.getNotification('whatever');
    Notifier.removeNotification(result);
    expect(Notifier.getCollection().length).toBe(0);
  });
});
