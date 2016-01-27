var batchProcessItems = require('../../../../javascripts/cartodb/common/batch_process_items');
var _ = require('underscore-cdb-v3');

describe('common/batch_process_items', function() {
  beforeEach(function() {
    this.items = _.range(42);
    this.processItemFn = jasmine.createSpy();
    this.howManyInParallel = 4;

    var self = this;
    batchProcessItems({
      howManyInParallel: this.howManyInParallel,
      items: this.items,
      processItem: this.processItemFn,
      done: function() {
        self.finishedAllSuccessfully = true;
      },
      fail: function(err) {
        self.somethingFailed = err;
      }
    });
  });

  it('should have started processing that many items', function() {
    expect(this.processItemFn.calls.count()).toEqual(this.howManyInParallel);
  });

  it('should not have called any callback until processing finished', function() {
    expect(this.finishedAllSuccessfully).toBeUndefined();
    expect(this.somethingFailed).toBeUndefined();
  });

  it('should have called the process fn with two arguments', function() {
    expect(this.processItemFn.calls.argsFor(0).length).toEqual(2);
  });

  it('should have called the process fn with the item as 1st arg', function() {
    var i = 3;
    var firstArg = this.processItemFn.calls.argsFor(i)[0];
    expect(firstArg).toEqual(this.items[i]);
  });

  it('should have called the process fn with item result callback fn as 2nd arg', function() {
    var i = 3;
    var secArg = this.processItemFn.calls.argsFor(i)[1];
    expect(secArg).toEqual(jasmine.any(Function));
  });

  describe('given all items finished successfully', function() {
    it('should wait until all items are processed before calling the done callback', function() {
      expect(this.finishedAllSuccessfully).toBeUndefined();
    });

    it('should have called the done callback after all finished', function() {
      _.each(this.items, function(item, i) {
        this.processItemFn.calls.argsFor(i)[1]();
      }, this);

      expect(this.finishedAllSuccessfully).toBeTruthy();
    });
  });

  describe('given at least one item fail', function() {
    beforeEach(function() {
      this.failIndex = 3;
      this.errorMsg = 'something fail for processing item '+ (this.failIndex+1);
      this.processItemFn.calls.argsFor(this.failIndex)[1](this.errorMsg);
    });

    it('should have called the fail callback after all finished', function() {
      expect(this.somethingFailed).toBeTruthy();
    });

    it('should pass error arg to the fail callback', function() {
      expect(this.somethingFailed).toEqual(this.errorMsg);
    });
  });
});
