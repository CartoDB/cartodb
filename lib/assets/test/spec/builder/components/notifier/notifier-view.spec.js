var Backbone = require('backbone');
var Notifier = require('builder/components/notifier/notifier.js');
var ConfigModel = require('builder/data/config-model');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var CoreView = require('backbone/core-view');

describe('components/notifier/notifier-view', function () {
  var view;
  var editorModel;

  beforeAll(function () {
    editorModel = new Backbone.Model();
    editorModel.isEditing = function () {
      return false;
    };

    var configModel = new ConfigModel({
      base_url: 'foo'
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
    }, {
      configModel: configModel
    });

    Notifier.init({
      editorModel: editorModel,
      visDefinitionModel: visDefinitionModel
    });

    Notifier.getCollection().reset();
  });

  beforeEach(function () {
    jasmine.clock().install();
    view = Notifier.getView();
    view.render();

    Notifier.addNotification({
      id: 'foo',
      closable: false
    });
  });

  afterEach(function () {
    Notifier.off();
    jasmine.clock().uninstall();
  });

  it('should render properly', function () {
    expect(view.el).toBeDefined();
    expect(view.$('.Notifier-inner').length).toBe(1);
    expect(view.$('.Notifier-icon').length).toBe(0);
    expect(view.$('#foo').length).toBe(1);
  });

  it('should rebind events properly', function () {
    var holder = new CoreView();
    var notifierView = Notifier.getView();
    spyOn(notifierView, 'rebindEvents');

    holder.$el.append(notifierView.render().el);
    holder.addView(notifierView);

    // clearSubViews calls to clear listeners
    holder.clearSubViews();

    Notifier.getView();
    expect(view.rebindEvents).toHaveBeenCalled();
  });

  it('should add subview properly', function () {
    Notifier.addNotification({
      id: 'bar'
    });
    expect(view.$('.Notifier-inner').length).toBe(2);
    expect(view.$('#foo').length).toBe(1);
    expect(view.$('#bar').length).toBe(1);
  });

  it('should remove subview properly', function () {
    Notifier.addNotification({
      id: 'bar'
    });
    Notifier.removeNotification('foo');

    expect(view.$('.Notifier-inner').length).toBe(1);
    expect(view.$('#bar').length).toBe(1);
    expect(view.$('#foo').length).toBe(0);
  });

  it('should update icon properly', function () {
    var model = Notifier.getNotification('foo');
    model.updateStatus('loading');

    expect(view.$('.Notifier-icon').length).toBe(1);
  });

  it('should update close button properly', function () {
    var model = Notifier.getNotification('foo');
    model.updateClosable(true);

    expect(view.$('.js-close').length).toBe(1);
    expect(view.$('.js-action').length).toBe(0);
  });

  it('should update button properly', function () {
    var model = Notifier.getNotification('foo');
    model.updateButton('OK');

    expect(view.$('.js-close').length).toBe(0);
    expect(view.$('.js-action').length).toBe(1);
  });

  it('should bind actions properly', function () {
    var callback = {
      fn: function () {}
    };

    spyOn(callback, 'fn');
    var model = Notifier.getNotification('foo');
    model.on('notification:close', callback.fn);
    model.on('notification:action', callback.fn);

    model.updateButton('OK');
    view.$('.js-action').trigger('click');
    expect(callback.fn).toHaveBeenCalled();

    model.updateClosable(true);
    view.$('.js-close').trigger('click');
    expect(callback.fn).toHaveBeenCalled();
  });

  it('should remove view on close properly', function () {
    var model = Notifier.getNotification('foo');
    model.updateClosable(true);
    view.$('.js-close').trigger('click');
    expect(view.$('.Notifier-inner').length).toBe(0);
  });

  it('should autoclose on success', function () {
    var model = Notifier.getNotification('foo');
    model.updateStatus('error');
    jasmine.clock().tick(Notifier.DEFAULT_DELAY + 1);
    expect(view.$('.Notifier-inner').length).toBe(1);
    model.updateClosable(true);
    model.updateStatus('success');
    jasmine.clock().tick(Notifier.DEFAULT_DELAY + 1);
    expect(view.$('.Notifier-inner').length).toBe(0);
  });

  it('should not autoclose on success if autoclose is not enabled', function () {
    Notifier.addNotification({
      id: 'bar',
      closable: true,
      autoclosable: false
    });

    var model = Notifier.getNotification('bar');
    model.updateStatus('error');
    jasmine.clock().tick(Notifier.DEFAULT_DELAY + 1);
    expect(view.$('.Notifier-inner').length).toBe(2);
    model.updateClosable(true);
    model.updateStatus('success');
    jasmine.clock().tick(Notifier.DEFAULT_DELAY + 1);
    expect(view.$('.Notifier-inner').length).toBe(2);
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
