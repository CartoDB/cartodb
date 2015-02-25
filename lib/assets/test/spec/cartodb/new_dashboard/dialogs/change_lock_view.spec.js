var ChangeLockDialog = require('../../../../../javascripts/cartodb/new_dashboard/dialogs/change_lock_view');
var cdb = require('cartodb.js');
var $ = require('jquery');
var ViewModel = require('../../../../../javascripts/cartodb/new_dashboard/dialogs/change_lock_view_model');

var sharedTestsForASetOfItems = function(opts) {
  beforeEach(function() {
    this.selectedItems = [
      new cdb.core.Model({ name: '1st', locked: opts.lockedInitially }),
      new cdb.core.Model({ name: '2nd', locked: opts.lockedInitially })
    ];

    this.viewModel = new ViewModel(this.selectedItems);

    this.view = new ChangeLockDialog({
      viewModel: this.viewModel,
      contentType: 'datasets'
    });

    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render a title with "' + opts.lockOrUnlockStr + '" + count of items to delete', function() {
    expect(this.innerHTML()).toContain(opts.lockOrUnlockStr.toLowerCase() + ' 2 datasets');
  });

  it('should render the lock description', function() {
    expect(this.innerHTML()).toContain('By ' + opts.lockOrUnlockStr.toLowerCase() + 'ing');
  });

  describe('when "OK, ' + opts.lockOrUnlockStr + '" button is clicked', function() {
    beforeEach(function() {
      spyOn(this.view, 'close').and.callThrough();
      this.selectedItems.forEach(function(model) {
        var dfd = $.Deferred();
        spyOn(model, 'save').and.returnValue(dfd.promise());
      });
      this.view.$('.js-ok').click();
    });

    it('should render processing message', function() {
      expect(this.innerHTML()).toContain(opts.lockOrUnlockStr + 'ing datasets');
    });

    describe('when change finishes successfully', function() {
      beforeEach(function() {
        this.viewModel.setState('ProcessItemsDone');
      });

      it('should close the dialog', function() {
        expect(this.view.close).toHaveBeenCalled();
      });
    });

    describe('when changing lock state fails', function() {
      beforeEach(function() {
        this.viewModel.setState('ProcessItemsFail');
      });

      it('should render error', function() {
        expect(this.view.close).not.toHaveBeenCalled();
      });
    });
  });
};

describe('new_dashboard/dialogs/change_lock_view', function() {
  describe('given a set of unlocked items', function() {
    sharedTestsForASetOfItems({
      lockedInitially: false,
      lockOrUnlockStr: 'Lock'
    });

    it('should indicate that lock is a negative action in styles', function() {
      expect(this.innerHTML()).toContain('--negative');
      expect(this.innerHTML()).not.toContain('--positive');
    });
  });

  describe('given a set of locked items', function() {
    sharedTestsForASetOfItems({
      lockedInitially: true,
      lockOrUnlockStr: 'Unlock'
    });

    it('should indicate that unlock is a positive action in styles', function() {
      expect(this.innerHTML()).toContain('--positive');
      expect(this.innerHTML()).not.toContain('--negative');
    });
  });

  afterEach(function() {
    if (this.view) {
      this.view.clean();
    }
  });
});
