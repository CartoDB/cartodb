var $ = require('jquery');
var Model = require('../../../src/core/model');

describe('core/model', function() {
  var TestModel;
  var model;

  beforeEach(function() {
    TestModel = Model.extend({
      initialize: function() {
        this.initCalled = true;
        Model.prototype.initialize.call(this);
      },
      url: 'irrelevant.json',
      test_method: function() {}
    });

    spyOn(Model.prototype, 'initialize').and.callThrough();
    model = new TestModel();
  });

  it("should call initialize", function() {
    expect(model.initCalled).toBe(true);
    expect(Model.prototype.initialize).toHaveBeenCalled();
  });

  it("should attach save to the element context", function() {
    spyOn(model, 'save');
    model.bind('irrelevantEvent', model.save);
    model.trigger('irrelevantEvent');
    expect(model.save).toHaveBeenCalled();
  })

  it("should attach fetch to the element context", function() {
    spyOn(model, 'fetch');
    model.bind('irrelevantEvent', model.fetch);
    model.trigger('irrelevantEvent');
    expect(model.fetch).toHaveBeenCalled();
  })

  it("should add the correct response from server", function() {
    model.sync = function(method, model, options) {
      options.success({ "response": true });
    }
    model.fetch();
    expect(model.get('response')).toBeTruthy();
  })

  it("should trigger 'loadModelStarted' event when fetch", function() {
    var loadModelStartedSpy = jasmine.createSpy('loadModelStarted');
    model.bind('loadModelStarted', loadModelStartedSpy);
    model.fetch();
    expect(loadModelStartedSpy).toHaveBeenCalled();
  });

  it("should trigger 'loadModelCompleted' event when fetched", function() {
    model.sync = function(method, model, options) {
      var dfd = $.Deferred();
      options.success({ "response": true });
      dfd.resolve();
      return dfd.promise();
    }
    var loadModelCompletedSpy = jasmine.createSpy('loadModelCompleted');
    model.bind('loadModelCompleted', loadModelCompletedSpy);
    model.fetch();
    expect(loadModelCompletedSpy).toHaveBeenCalled();
  })

  it("should trigger 'loadModelFailed' event when fetch fails", function() {
    model.url = 'irrelevantError.json';

    model.sync = function(method, model, options) {
      var dfd = $.Deferred();
      options.error({ "response": true });
      return dfd.reject();
    };

    var loadModelFailedSpy = jasmine.createSpy('loadModelFailed');
    model.bind('loadModelFailed', loadModelFailedSpy);

    model.fetch();
    expect(loadModelFailedSpy).toHaveBeenCalled();
  });

  it("should retrigger an event when launched on a descendant object", function(done) {
    model.child = new TestModel({});
    model.retrigger('cachopo', model.child);
    var spy = jasmine.createSpy('spy');
    model.bind('cachopo', spy);
    model.child.trigger('cachopo');
    setTimeout(function(){
      expect(spy).toHaveBeenCalled();
      done();
    }, 25);
  });

  it("should trigger 'saving' event when save", function() {
    var savingSpy = jasmine.createSpy('saving');
    model.bind('saving', savingSpy);
    model.save();
    expect(savingSpy).toHaveBeenCalled();
  });

  it("should trigger 'saved' event when saved", function() {
    model.sync = function(method, model, options) {
      var dfd = $.Deferred();
      options.success({ "response": true });
      dfd.resolve();
      return dfd.promise();
    }
    var savedSpy = jasmine.createSpy('saving');
    model.bind('saved', savedSpy);
    model.save();
    expect(savedSpy).toHaveBeenCalled();
  })

  it("should trigger 'errorSaving' event when save fails", function() {
    model.url = 'irrelevantError.json'

    model.sync = function(method, model, options) {
      var dfd = $.Deferred();
      options.error({ "response": true });
      return dfd.reject();
    };

    var errorSavingSpy = jasmine.createSpy('errorSaving');
    model.bind('errorSaving', errorSavingSpy);

    model.save();
    expect(errorSavingSpy).toHaveBeenCalled();
  });



});
