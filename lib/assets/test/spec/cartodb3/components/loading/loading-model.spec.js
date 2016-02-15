var LoadingModel = require('../../../../../javascripts/cartodb3/components/loading/loading-model');

describe('components/loading/loading-model', function () {
  beforeEach(function () {
    this.predicateSpy = jasmine.createSpy('predicate');
    this.createContentViewSpy = jasmine.createSpy('createContentView');
    this.model = new LoadingModel({
      title: 'Happy-case test',
      predicate: this.predicateSpy,
      createContentView: this.createContentViewSpy
    });
  });

  it('should have a default, empty, desc', function () {
    expect(this.model.get('desc')).toEqual('');
  });

  describe('.isReady', function () {
    it('returns true when predicate pass', function () {
      this.predicateSpy.and.returnValue(false);
      expect(this.model.isReady()).toBe(false);

      this.predicateSpy.and.returnValue(true);
      expect(this.model.isReady()).toBe(true);
    });
  });

  describe('.createContentView', function () {
    beforeEach(function () {
      this.createContentViewSpy.and.returnValue(this.result);
    });

    it('should return a new createdContentView', function () {
      var res = this.model.createContentView();
      expect(this.createContentViewSpy).toHaveBeenCalled();
      expect(res).toBe(this.result);
    });

    it('should pass the given opts', function () {
      var opts = {};
      this.model.createContentView(opts);
      expect(this.createContentViewSpy).toHaveBeenCalledWith(opts);
    });
  });
});
