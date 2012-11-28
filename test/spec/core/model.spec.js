
describe("core.Model", function() {

  var TestModel = cdb.core.Model.extend({
    url: 'irrelevant.json',
    initialize: function() {
      this.initCalled = true;
      this.elder('initialize');
    },
    save: function() {
      this.saveCalled = true;
      this.elder('save');
    },
    fetch: function() {
      this.fetchCalled = true;
      this.elder('fetch');
    },
    test_method: function() {}
  });

  var model;

  beforeEach(function() {
    this.server = sinon.fakeServer.create();
    this.server.respondWith("GET", "irrelevant.json",
                                [200, { "Content-Type": "application/json" },
                                 '{ "response": true }']);
    this.server.respondWith("GET", "irrelevantError.json",
                                [500, { "Content-Type": "application/json" },
                                 '{ "response": false }']);
    this.server.respondWith("POST", "irrelevant.json",
                                [200, { "Content-Type": "application/json" },
                                 '{ "response": true }']);
    this.server.respondWith("POST", "irrelevantError.json",
                                [500, { "Content-Type": "application/json" },
                                 '{ "response": false }']);
    var requests = this.requests = [];
    sinon.spy(cdb.core.Model.prototype, "initialize");
    model = new TestModel();
  });

  afterEach(function() {
    this.server.restore();
    cdb.core.Model.prototype.initialize.restore();
  })

  it("should call initialize", function() {
    expect(model.initCalled).toBeTruthy();
  });

  it("should call cdb.core.Model initialize method too", function() {
    expect(cdb.core.Model.prototype.initialize.calledOnce).toBeTruthy();
  });

  it("should attach save to the element context", function() {
    model.bind('irrelevantEvent', model.save);
    model.trigger('irrelevantEvent');
    expect(model.saveCalled).toBeTruthy;
  })

  it("should attach fetch to the element context", function() {
    model.bind('irrelevantEvent', model.fetch);
    model.trigger('irrelevantEvent');
    expect(model.fetchCalled).toBeTruthy;
  })

  it("should add the correct response from server", function() {
    model.sync = function(method, model, options) {
      options.success({ "response": true });
    }
    model.fetch();
    this.server.respond();
    expect(model.get('response')).toBeTruthy();
  })

  it("should trigger 'loadModelStarted' event when fetch", function() {
    var triggered = false;
    model.bind('loadModelStarted', function() {
      triggered = true;
    })
    model.fetch();
    expect(triggered).toBeTruthy();
  });

  it("should trigger 'loadModelCompleted' event when fetched", function() {
    var triggered = false;
    model.sync = function(method, model, options) {
      var dfd = $.Deferred();
      options.success({ "response": true });
      dfd.resolve();
      return dfd.promise();
    }
    model.bind('loadModelCompleted', function() {
      triggered = true;
    })
    model.fetch();
    this.server.respond();
    expect(triggered).toBeTruthy();
  })

  it("should trigger 'loadModelFailed' event when fetch fails", function() {
    var triggered = false;
    model.url = 'irrelevantError.json'
    model.bind('loadModelFailed', function() {
      triggered = true;
    })
    model.fetch();
    this.server.respond();
    expect(triggered).toBeTruthy();
  });

  it("should retrigger an event when launched on a descendant object", function() {
    var launched = false;
    model.child = new TestModel({});
    model.retrigger('cachopo', model.child);
    model.bind('cachopo', function() {
      launched = true;
    }),
    model.child.trigger('cachopo');
    waits(25);

    expect(launched).toBeTruthy();
  });

  it("should trigger 'saving' event when save", function() {
    var triggered = false;
    model.bind('saving', function() {
      triggered = true;
    })
    model.save();
    expect(triggered).toBeTruthy();
  });

  it("should trigger 'saved' event when saved", function() {
    var triggered = false;
    model.sync = function(method, model, options) {
      var dfd = $.Deferred();
      options.success({ "response": true });
      dfd.resolve();
      return dfd.promise();
    }
    model.bind('saved', function() {
      triggered = true;
    })
    model.save();
    this.server.respond();
    expect(triggered).toBeTruthy();
  })

  it("should trigger 'errorSaving' event when save fails", function() {
    var triggered = false;
    model.url = 'irrelevantError.json'
    model.bind('errorSaving', function() {
      triggered = true;
    })
    model.save();
    this.server.respond();
    expect(triggered).toBeTruthy();
  });



});
