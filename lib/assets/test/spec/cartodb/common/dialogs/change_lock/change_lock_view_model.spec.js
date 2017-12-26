var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var ChangeLockViewModel = require('../../../../../../javascripts/cartodb/common/dialogs/change_lock/change_lock_view_model');

describe('common/dialogs/change_lock/change_lock_view_model', function() {
  beforeEach(function() {
    this.models = [
      new cdb.core.Model({ locked: true }),
      new cdb.core.Model({ locked: true })
    ];

    this.viewModel = new ChangeLockViewModel({
      items: this.models
    });
  });

  it('should throw error if given models have inconsistent locked values', function() {
    this.models[0].set('locked', false);
    expect(function() {
      this.createViewModel();
    }).toThrowError();
  });

  describe('state', function() {
    it('should have an initial value of confirm-change-lock', function() {
      expect(this.viewModel.get('state')).toEqual('ConfirmChangeLock');
    });
  });

  describe('initialLockValue', function() {
    it('should return the lock value the models have initially', function() {
      expect(this.viewModel.get('initialLockValue')).toBeTruthy();

      // Should still be same even if models change
      this.models[0].set('locked', false);
      this.models[1].set('locked', false);
      expect(this.viewModel.get('initialLockValue')).toBeTruthy();
    });
  });

  describe('.inverseLock', function() {
    beforeEach(function() {
      this.modelDeferreds = [];
      this.models.forEach(function(model, i) {
        var dfd = $.Deferred();
        spyOn(model, 'save').and.returnValue(dfd.promise());
        this.modelDeferreds[i] = dfd;
      }, this);

      this.changeCount = 0;
      this.viewModel.bind('change', function() {
        this.changeCount++;
      }, this);

      this.viewModel.inverseLock();
    });

    it('should change state to processing-items', function() {
      expect(this.viewModel.get('state')).toEqual('ProcessingItems');
    });

    it('should call save on each item with the inverse lock value', function() {
      this.models.forEach(function(model) {
        expect(model.save).toHaveBeenCalled();
        expect(model.save.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ locked: false }));
      }, this);
    });

    it('should trigger a change once', function() {
      expect(this.changeCount).toEqual(1);
    });

    describe('when all items are finished', function() {
      beforeEach(function() {
        this.modelDeferreds.forEach(function(dfd) {
          dfd.resolve();
        });
      });

      it('should trigger a change event again', function() {
        expect(this.changeCount).toEqual(2);
      });

      it('should change state to all done', function() {
        expect(this.viewModel.get('state')).toEqual('ProcessItemsDone');
      });
    });

    describe('when an item fail', function() {
      beforeEach(function() {
        this.modelDeferreds[0].reject('oups');
      });

      it('should trigger a change event again', function() {
        expect(this.changeCount).toEqual(2);
      });

      it('should change state to all fail', function() {
        expect(this.viewModel.get('state')).toEqual('ProcessItemsFail');
      });
    });
  });
});
