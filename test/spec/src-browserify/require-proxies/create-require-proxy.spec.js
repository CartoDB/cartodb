var createProxy = require('../../../../src-browserify/require-proxies/create-require-proxy');

describe('require-proxies/create-require-proxy', function() {
  beforeEach(function() {
    this.foobar = createProxy('foobar');
  });

  it('should create an proxy object', function() {
    expect(this.foobar).toBeDefined();
    expect(this.foobar.get).toEqual(jasmine.any(Function));
    expect(this.foobar.set).toEqual(jasmine.any(Function));
  });

  it('should require an instance to be set before can get', function() {
    expect(function() { this.foobar.get() }).toThrow();
  });

  it('should not allow to set a falsy value', function() {
    var foobar = this.foobar;
    expect(function() { foobar.set() }).toThrow();
    expect(function() { foobar.set(null) }).toThrow();
    expect(function() { foobar.set(undefined) }).toThrow();
    expect(function() { foobar.set('') }).toThrow();
    expect(function() { foobar.set(false) }).toThrow();
  });

  describe('once instance is set', function() {
    beforeEach(function() {
      this.myObj = {};
      this.result = this.foobar.set(this.myObj)
    });

    it('should return the proxy object itself from the set call', function() {
      expect(this.result).toBe(this.foobar); // enabled chained calls
    });

    it("should return instance from .get()", function() {
      expect(this.foobar.get()).toBe(this.myObj);
    });

    describe('when unset', function() {
      beforeEach(function() {
        this.foobar.__unset();
      });

      it('should ', function() {
        expect(function() { this.foobar.get() }).toThrow();
      });
    });

    describe('when reset', function() {
      beforeEach(function() {
        createProxy.__reset();
      });

      it('should throw err again if trying to get any', function() {
        expect(function() { this.foobar.get() }).toThrow();
      });
    });
  });
});
