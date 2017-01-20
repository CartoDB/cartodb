var _ = require('underscore');

var fakeWax = {
  _eventCallbacks: {},

  map: jasmine.createSpy('map'),

  tilejson: jasmine.createSpy('tilejson'),

  on: function (eventName, callback) {
    this._eventCallbacks[eventName] = this._eventCallbacks[eventName] || [];
    this._eventCallbacks[eventName].push(callback);
    return this;
  },

  fire: function (eventName, event) {
    this._eventCallbacks[eventName] = this._eventCallbacks[eventName] || [];
    _.each(this._eventCallbacks[eventName], function (callback) {
      callback(event);
    });
  },

  unbindEvents: function () {
    this._eventCallbacks = {};
  },

  remove: jasmine.createSpy('remove')
};

fakeWax.map.and.returnValue(fakeWax);
fakeWax.tilejson.and.returnValue(fakeWax);
fakeWax.remove.and.returnValue(fakeWax);

var FakeWax = function () {
  return fakeWax;
};

module.exports = FakeWax;
