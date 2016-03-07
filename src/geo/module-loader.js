var cdb = require('cdb');
var _ = require('underscore');
var config = require('cdb.config');
var Loader = require('../core/loader');

var ModuleLoader = function (options) {
  options = options || {};
  this._loader = options.loader || Loader;
  this._moduleChecked = false;
};

ModuleLoader.prototype.LAYER_TYPE_TO_MODULE_NAME_MAP = {
  torque: 'torque'
};

ModuleLoader.prototype.loadModuleForLayer = function (layerModel, callback) {
  var moduleName = this._getModuleNameForLayer(layerModel);
  if (moduleName) {
    if (this._isModuleLoaded(moduleName)) {
      callback();
    } else {
      this._loadModule(moduleName, callback);
    }
  } else {
    callback();
  }
};

ModuleLoader.prototype._getModuleNameForLayer = function (layerModel) {
  return this.LAYER_TYPE_TO_MODULE_NAME_MAP[layerModel.get('type')];
};

ModuleLoader.prototype._isModuleLoaded = function (moduleName) {
  return cdb[moduleName] !== undefined;
};

ModuleLoader.prototype._loadModule = function (moduleName, callback) {
  var self = this;

  if (this._moduleChecked) {
    throw new Error("'" + moduleName + "' module couldn't be loaded");
  }
  this._loader.loadModule(moduleName);
  this._moduleChecked = true;
  var onModuleLoaded = function () {
    if (self._isModuleLoaded(moduleName)) {
      config.unbind('moduleLoaded', this);
      callback();
    }
  };

  config.bind('moduleLoaded', onModuleLoaded);
  _.defer(onModuleLoaded);
};

module.exports = ModuleLoader;
