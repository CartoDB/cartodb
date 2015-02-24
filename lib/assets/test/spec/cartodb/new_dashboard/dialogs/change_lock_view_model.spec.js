var ChangeLockViewModel = require('../../../../../javascripts/cartodb/new_dashboard/dialogs/change_lock_view_model');
var cdb = require('cartodb.js');
var $ = require('jquery');

describe('new_dashboard/dialogs/change_lock_view_model', function() {
  beforeEach(function() {
    this.models = [
      new cdb.core.Model({ locked: true }),
      new cdb.core.Model({ locked: true })
    ];

    this.createViewModel = function() {
      this.viewModel = new ChangeLockViewModel(this.models);
    };
  });

  it('should throw error if given models have inconsistent locked values', function() {
    this.models[0].set('locked', false);
    expect(function() {
      this.createViewModel();
    }).toThrowError();
  });

  describe('.state', function() {
    beforeEach(function() {
      this.createViewModel();
    });

    it('should return confirm-change-lock as initial state', function() {
      expect(this.viewModel.state()).toEqual('ConfirmChangeLock');
    });
  });

  describe('.initialLockValue', function() {
    it('returns the lock value the models have initially', function() {
      this.createViewModel();
      expect(this.viewModel.initialLockValue()).toBeTruthy();

      // Should still be same even if models change
      this.models[0].set('locked', false);
      this.models[1].set('locked', false);
      expect(this.viewModel.initialLockValue()).toBeTruthy();
    });
  });

  describe('.inverseLock', function() {
    beforeEach(function() {
      this.createViewModel();
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
      this.viewModel.bind('ProcessItemsDone', function() {
        this.processItemsDoneCalled = true;
      }, this);
      this.viewModel.bind('ProcessItemsFail', function() {
        this.processItemsFailCalled = true;
      }, this);

      this.viewModel.inverseLock();
    });

    it('should change state to processing-items', function() {
      expect(this.viewModel.state()).toEqual('ProcessingItems');
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

      it('should trigger a done event', function() {
        expect(this.processItemsDoneCalled).toBeTruthy();
      });
    });

    describe('when an item fail', function() {
      beforeEach(function() {
        this.modelDeferreds[0].reject('oups');
      });

      it('should trigger a change event again', function() {
        expect(this.changeCount).toEqual(2);
      });

      it('should trigger a fail event', function() {
        expect(this.processItemsFailCalled).toBeTruthy();
      });
    });

  });
});
