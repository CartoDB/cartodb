var storage = (function () {
  var storageName = 'cdb';
  var version = '0.1.0';
  var mainStorageKey;
  var initialized = false;
  var userModel;

  function init (key, opts) {
    if (!key) {
      throw new Error('key is required');
    }

    if (!userModel && !opts) {
      throw new Error('userModel is required');
    }

    if (!userModel && opts && opts.userModel) {
      userModel = opts.userModel;
    }

    mainStorageKey = key;
    initialized = true;
  }

  function getKey (key) {
    return [storageName, version, userModel.get('username'), mainStorageKey, key].join('.');
  }

  function isSupported () {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  return {
    init: function (key, opts) {
      if (!isSupported()) throw new Error('localStorage not supported in your browser');
      init(key, opts);
    },

    get: function (key) {
      if (!initialized) {
        init();
      }
      var storageKey = getKey(key);
      return localStorage[storageKey];
    },

    set: function (key, value) {
      if (!initialized) {
        init();
      }
      var storageKey = getKey(key);
      localStorage[storageKey] = value;
    },

    delete: function (key) {
      if (!initialized) {
        init();
      }

      var storageKey = getKey(key);
      delete localStorage[storageKey];
    }
  };
})();

module.exports = storage;
