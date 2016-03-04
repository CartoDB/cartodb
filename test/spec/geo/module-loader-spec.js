var _ = require('underscore');
var Backbone = require('backbone');
var ModuleLoader = require('../../../src/geo/module-loader');
var cdb = require('cdb');
var config = require('cdb.config');

describe('src/geo/module-loader', function () {
  beforeEach(function () {
    this.fakeLoader = new Backbone.Model();

    this.fakeLoader.loadModule = jasmine.createSpy('loadModule').and.callFake(function (moduleName) {
      cdb[moduleName] = 'something';
      config.trigger('moduleLoaded');
    });

    delete cdb.torque;
  });

  it('should load the module for a torque layer and invoke the callback', function (done) {
    var callback = jasmine.createSpy('callback');
    var moduleLoader = new ModuleLoader({
      loader: this.fakeLoader
    });

    var layerModel = jasmine.createSpyObj('layerModel', ['get']);
    layerModel.get.and.returnValue('torque');

    moduleLoader.loadModuleForLayer(layerModel, callback);

    expect(this.fakeLoader.loadModule).toHaveBeenCalledWith('torque');

    _.defer(function () {
      expect(callback).toHaveBeenCalled();
      done();
    });
  });

  it("should throw an error if the module hasn't been loaded yet and we try to load it again", function (done) {
    var callback = jasmine.createSpy('callback');
    this.fakeLoader.loadModule.and.callFake(function (moduleName) {
      // This loader does nothing
    });

    var moduleLoader = new ModuleLoader({
      loader: this.fakeLoader
    });

    var layerModel = jasmine.createSpyObj('layerModel', ['get']);
    layerModel.get.and.returnValue('torque');

    moduleLoader.loadModuleForLayer(layerModel, callback);
    expect(function () {
      moduleLoader.loadModuleForLayer(layerModel, callback);
    }).toThrowError("Module for layer of type torque couldn't be loaded");

    _.defer(function () {
      expect(callback).not.toHaveBeenCalled();
      done();
    });
  });

  it('should just invoke the callback if layer doesn\'t need to load a module', function () {
    var callback = jasmine.createSpy('callback');
    var moduleLoader = new ModuleLoader({
      loader: this.fakeLoader
    });

    var layerModel = jasmine.createSpyObj('layerModel', ['get']);
    layerModel.get.and.returnValue('something');

    moduleLoader.loadModuleForLayer(layerModel, callback);

    expect(this.fakeLoader.loadModule).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });
});
