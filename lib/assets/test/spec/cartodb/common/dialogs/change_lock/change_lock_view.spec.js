var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var ViewModel = require('../../../../../../javascripts/cartodb/common/dialogs/change_lock/change_lock_view_model');
var ChangeLockDialog = require('../../../../../../javascripts/cartodb/common/dialogs/change_lock/change_lock_view');

var sharedTestsForASetOfItems = function(opts) {
  beforeEach(function() {
    this.selectedItems = [
      new cdb.core.Model({ name: '1st', locked: opts.lockedInitially }),
      new cdb.core.Model({ name: '2nd', locked: opts.lockedInitially })
    ];

    this.viewModel = new ViewModel({
      items: this.selectedItems,
      contentType: 'datasets'
    });

    this.view = new ChangeLockDialog({
      model: this.viewModel
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
    expect(this.innerHTML()).toContain(opts.lockOrUnlockStr + 'ing');
  });

  it('should have a default template if none is given', function() {
    expect(this.view.options.template).toEqual(jasmine.any(Function));
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
        this.viewModel.set('state', 'ProcessItemsDone');
      });

      it('should close the dialog', function() {
        expect(this.view.close).toHaveBeenCalled();
      });
    });

    describe('when changing lock state fails', function() {
      beforeEach(function() {
        this.viewModel.set('state', 'ProcessItemsFail');
      });

      it('should render error', function() {
        expect(this.view.close).not.toHaveBeenCalled();
      });
    });
  });
};

describe('common/dialogs/change_lock/change_lock_view', function() {
  describe('given a set of unlocked items', function() {
    sharedTestsForASetOfItems({
      lockedInitially: false,
      lockOrUnlockStr: 'Lock'
    });

    it('should indicate that lock is a negative action in styles', function() {
      expect(this.innerHTML()).toContain('--alert');
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
      expect(this.innerHTML()).not.toContain('--alert');
    });

    describe('when given the template for opening item on dashboard', function() {
      beforeEach(function() {
        this.view.clean(); // previous created view
        this.view = new ChangeLockDialog({
          model: this.viewModel,
          isOwner: true,
          ownerName: "cartodb",
          template: cdb.templates.getTemplate('common/dialogs/change_lock/templates/unlock_to_editor')
        });
        this.view.render();
      });

      it('should render fine', function() {
        expect(this.innerHTML()).toContain('is locked');
        expect(this.innerHTML()).toContain('That means you need to unlock it');
      });
    });

    describe('when given the template for opening item from other user on dashboard', function() {
      beforeEach(function() {
        this.view.clean(); // previous created view
        this.view = new ChangeLockDialog({
          model: this.viewModel,
          isOwner: false,
          ownerName: "cartodb",
          template: cdb.templates.getTemplate('common/dialogs/change_lock/templates/unlock_to_editor')
        });
        this.view.render();
      });

      it('should render fine', function() {
        expect(this.innerHTML()).toContain('was locked by cartodb');
        expect(this.innerHTML()).toContain('That means you need to unlock it');
      });
    });
  });

  afterEach(function() {
    if (this.view) {
      this.view.clean();
    }
  });
});
