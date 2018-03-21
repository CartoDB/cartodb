var Notifier = require('builder/components/notifier/notifier.js');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var ConfigModel = require('builder/data/config-model');
var Backbone = require('backbone');

describe('components/notifier/notifier', function () {
  var editorModel;

  beforeEach(function () {
    editorModel = new Backbone.Model();
    editorModel.isEditing = function () { return false; };

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
    }, {
      configModel: configModel
    });

    Notifier.init({
      editorModel: editorModel,
      visDefinitionModel: this.visDefinitionModel
    });

    this.model = Notifier.addNotification({
      id: 'whatever'
    });
  });

  afterEach(function () {
    Notifier.off();
  });

  it('should return the view properly', function () {
    expect(Notifier.getView()).toBeDefined();
    expect(Notifier.getCount()).toBeDefined();
  });

  it('should set collection properly', function () {
    expect(this.model.collection).toBeDefined();
  });

  it('model should retrigger vis events', function () {
    var spy = jasmine.createSpy('spy');
    this.model.on('vis:reload', spy);
    this.visDefinitionModel.trigger('vis:reload');
    expect(spy).toHaveBeenCalled();
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
    expect(result).toBe(this.model);

    var result2 = Notifier.getNotification(this.model);
    expect(result2).toBe(this.model);
  });

  it('should have different ids', function () {
    var n1 = Notifier.addNotification({
      status: 'success',
      info: 'First',
      closable: true
    });

    var n2 = Notifier.addNotification({
      status: 'error',
      info: 'Second',
      closable: true
    });

    expect(n1.get('id') !== n2.get('id')).toBe(true);
  });

  it('should remove two o more views created at the same time', function () {
    var n1 = Notifier.addNotification({
      status: 'success',
      info: 'First',
      closable: true
    });

    var n2 = Notifier.addNotification({
      status: 'error',
      info: 'Second',
      closable: true
    });

    n1.collection.remove(n1);
    n2.collection.remove(n2);
    this.model.collection.remove(this.model);

    expect(Notifier.getCollection().length).toBe(0);
  });

  it('should remove notification properly', function () {
    var result = Notifier.getNotification('whatever');
    Notifier.removeNotification(result);
    expect(Notifier.getCollection().length).toBe(0);
  });

  describe('.getCount', function () {
    it('should return the collection size', function () {
      Notifier.addNotification({
        status: 'success',
        info: 'First',
        closable: true
      });

      Notifier.addNotification({
        status: 'error',
        info: 'Second',
        closable: true
      });

      expect(Notifier.getCount()).toBe(3);
    });
  });

  describe('.addNotification', function () {
    it('should call collection.addNotification', function () {
      spyOn(this.model.collection, 'addNotification');

      Notifier.addNotification({
        status: 'success',
        info: 'First',
        closable: true
      });

      expect(this.model.collection.addNotification).toHaveBeenCalled();
    });
  });
});
