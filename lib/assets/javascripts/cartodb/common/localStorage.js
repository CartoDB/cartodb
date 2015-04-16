(function(){
  var localStorageWrapper = function(name) {
    this.name = name;
  }

  localStorageWrapper.prototype.init = function() {
    if (!this.isReady()) {
      localStorage.setItem(this.name, "[]");
    }
  }

  localStorageWrapper.prototype.isReady = function() {
    if (localStorage.getItem(this.name)) {
      return true;
    } else {
      return false;
    }
  }

  localStorageWrapper.prototype.get = function(n) {
    if (!this.isReady()) {
      return [];
    }

    if (n === undefined) {
      return JSON.parse(localStorage.getItem(this.name));
    }

    var data = JSON.parse(localStorage.getItem(this.name));

    if (data) {
      return data[n];
    } else {
      return [];
    }

  }

  localStorageWrapper.prototype.search = function(searchTerm) {
    var wholeArray = JSON.parse(localStorage.getItem(this.name));
    for(var i in wholeArray) {
      if(wholeArray[i][searchTerm]) {
        return wholeArray[i][searchTerm];
      }
    }
    return null;
  }

  localStorageWrapper.prototype.set = function(data) {
    this.init();
    return localStorage.setItem(this.name, JSON.stringify(data));
  }

  localStorageWrapper.prototype.add = function(obj) {
    var data = this.get();
    if(data) {
      data.push(obj);
      return this.set(data);
    }
  }

  localStorageWrapper.prototype.remove = function(n) {
    var data = this.get();
    data.splice(n,n);
    return this.set(data);
  }

  localStorageWrapper.prototype.destroy = function() {
    delete localStorage[this.name]
  }

  cdb.admin.localStorage = localStorageWrapper;
}())
