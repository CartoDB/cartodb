var _ = require('underscore');

/**
 *  Local storage wrapper
 *
 *  - It should be used within 'cartodb' key, for example:
 *
 *  var loc_sto = new cdb.common.LocalStorage();
 *  loc_sto.set({ 'dashboard.order': 'create_at' });
 *  loc_sto.get('dashboard.order');
 *
 */

var LocalStorageWrapper = function (name) {
  this.name = name || 'cartodb';
  if (!localStorage.getItem(this.name) && this.isEnabled()) {
    localStorage.setItem(this.name, '{}');
  }
};

// Some browsers with private mode don't allow to use
// local storage
LocalStorageWrapper.prototype.isEnabled = function () {
  try {
    localStorage.setItem('checking', 'test');
    localStorage.removeItem('checking');
    return true;
  } catch (e) {
    return false;
  }
};

LocalStorageWrapper.prototype.get = function (n) {
  if (!this.isEnabled()) return false;

  if (n === undefined) {
    return JSON.parse(localStorage.getItem(this.name));
  } else {
    var data = JSON.parse(localStorage.getItem(this.name));
    return data[n];
  }
};

LocalStorageWrapper.prototype.search = function (searchTerm) {
  if (!this.isEnabled()) return null;

  var wholeArray = JSON.parse(localStorage.getItem(this.name));

  for (var i in wholeArray) {
    if (wholeArray[i][searchTerm]) {
      return wholeArray[i][searchTerm];
    }
  }
  return null;
};

LocalStorageWrapper.prototype.set = function (data) {
  if (!this.isEnabled()) return null;
  var d = _.extend(this.get(), data);
  return localStorage.setItem(this.name, JSON.stringify(d));
};

LocalStorageWrapper.prototype.add = function (obj) {
  return this.set(obj);
};

LocalStorageWrapper.prototype.remove = function (n) {
  if (!this.isEnabled()) return null;
  var d = _.omit(this.get(), n);
  return localStorage.setItem(this.name, JSON.stringify(d));
};

LocalStorageWrapper.prototype.destroy = function () {
  delete localStorage.removeItem(this.name);
};

module.exports = LocalStorageWrapper;
