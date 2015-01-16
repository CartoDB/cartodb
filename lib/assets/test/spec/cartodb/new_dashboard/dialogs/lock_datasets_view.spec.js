var LockDatasetsDialog = require('new_dashboard/dialogs/lock_datasets_view');
var cdb = require('cartodb.js');

describe('new_dashboard/dialogs/lock_datasets_view', function() {
  describe('given view is instantiated with datasets with different locked states', function() {
    beforeEach(function() {
      this.datasets = [
        new cdb.core.Model({ locked: true }),
        new cdb.core.Model({ locked: false })
      ]
    });

    it('should not allow to create a dialog with datasets that have different locked states', function() {
      var self = this;
      expect(function() {
        new LockDatasetsDialog({
          datasets: self.datasets
        });
      }).toThrow(new Error('It is assumed that all datasets have the same locked state, a user should never be able to ' +
        'select a mixed dataset with current UI. If you get an error with this message something is broken'));
    });

    describe('given trackJS is loaded (production)', function() {
      beforeEach(function() {
        window.trackJs = jasmine.createSpyObj('trackJs', ['track']);
        new LockDatasetsDialog({
          datasets: this.datasets
        });
      });

      it('should track error', function() {
        expect(window.trackJs.track).toHaveBeenCalledWith('It is assumed that all datasets have the same locked state, a user should never be able to ' +
        'select a mixed dataset with current UI. If you get an error with this message something is broken');
      });

      afterEach(function() {
        window.trackJs = undefined;
        delete window.trackJs;
      });
    });
  });

  describe('given a set of unlocked datasets', function() {
    sharedTestsForASetOfDatasets({
      lockedInitially: false,
      lockOrUnlockStr: 'Lock'
    });
    
    it('should indicate that lock is a negative action in styles', function() {
      expect(this.innerHTML()).toContain('--negative');
      expect(this.innerHTML()).not.toContain('--positive');
    });
  });
  
  describe('given a set of locked datasets', function() {
    sharedTestsForASetOfDatasets({
      lockedInitially: true,
      lockOrUnlockStr: 'Unlock'
    });
    
    it('should indicate that unlock is a positive action in styles', function() {
      expect(this.innerHTML()).toContain('--positive');
      expect(this.innerHTML()).not.toContain('--negative');
    });
  });

  afterEach(function() {
    this.view && this.view.clean();
  });
});


function sharedTestsForASetOfDatasets(opts) {
  beforeEach(function() {
    this.selectedDatasets = [
      new cdb.core.Model({ name: '1st', locked: opts.lockedInitially }),
      new cdb.core.Model({ name: '2nd', locked: opts.lockedInitially })
    ];
    this.saves = [];
    this.selectedDatasets.forEach(function(ds) {
      jqXHR = jasmine.createSpyObj('jqXHR', ['done', 'fail']);
      jqXHR.done.and.returnValue(jqXHR);
      jqXHR.fail.and.returnValue(jqXHR);
      spyOn(ds, 'save').and.returnValue(jqXHR);
      this.saves.push(jqXHR);
    }, this);
    this.view = new LockDatasetsDialog({
      datasets: this.selectedDatasets
    });
    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render a title with '+ opts.lockOrUnlockStr +'+ name of selected datasets separated by commas', function() {
    expect(this.innerHTML()).toContain(opts.lockOrUnlockStr +' 1st, 2nd');
  });

  it('should render the lock description', function() {
    expect(this.innerHTML()).toContain('By '+ opts.lockOrUnlockStr.toLowerCase() +'ing');
  });

  describe('and "OK, '+ opts.lockOrUnlockStr +'" button is clicked', function() {
    beforeEach(function() {
      spyOn(this.view, 'close').and.callThrough();
      spyOn(this.view, 'undelegateEvents');
      spyOn(this.view, 'delegateEvents');
      this.view.$('.js-ok').click();
    });

    describe('and while change are in process', function() {
      it('should disable click handler so user cannot click multiple times', function() {
        expect(this.view.undelegateEvents).toHaveBeenCalled();
      });
    });

    describe('and change finishes successfully', function() {
      beforeEach(function() {
        this.saves.forEach(function(save) {
          save.done.calls.argsFor(0)[0]();
        }, this);
      });

      it('should save with locked value inversed', function() {
        this.selectedDatasets.forEach(function(ds) {
          expect(ds.save.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ locked: !opts.lockedInitially}));
        });
      });

      it('should delete the dialog', function() {
        expect(this.view.close).toHaveBeenCalled();
      });
    });

    describe('and a set fails', function() {
      beforeEach(function() {
        this.saves[0].fail.calls.argsFor(0)[0]('b0rk it!');
      });

      it('should enable buttons again', function() {
        expect(this.view.delegateEvents).toHaveBeenCalled();
      });
      
      it('should leave dialog open', function() {
        expect(this.view.close).not.toHaveBeenCalled();
      });
    });
  });
}
