var ChangePrivacyDialog = require('new_dashboard/dialogs/change_privacy_view');
var cdb = require('cartodb.js');
var cdbAdmin = require('cdb.admin');

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The importat feature is the interactions and that view don't throw errors on render and updates.
 */
describe('new_dashboard/dialogs/change_privacy_view', function() {
  beforeEach(function() {
    this.item = new cdb.core.Model({ name: 'foobar' });
    
    this.user = new cdbAdmin.User({
      username: 'pepe',
      actions: {
        private_tables: true,
        private_maps: true
      }
    });
    
    this.vis = new cdbAdmin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.view = new ChangePrivacyDialog({
      vis: this.vis,
      user: this.user
    });
    this.view.render(); 
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('given a normal user', function() {
    it('should render call-to-action to upgrade', function() {
      pending();
    });
  });
  
  it('should have the first (public) option is selected by default', function() {
    expect(this.innerHTML()).toMatch('is-selected.+data-index="0"');
  });

  it('should not render the password input', function() {
    expect(this.innerHTML()).not.toContain('<input');
  });

  it('should not disable the save button', function() {
    expect(this.innerHTML()).not.toContain('is-disabled');
  });

  describe('on click .js-option', function() {
    beforeEach(function() {
      this.select = function(index) {
        $(this.view.$('.js-option')[index]).click();
      }
    });

    it('should have selected item', function() {
      expect(this.view.options.at(1).get('selected')).toBeFalsy();
      
      this.select(1);
      expect(this.view.options.at(1).get('selected')).toBeTruthy();

      this.select(0);
      expect(this.view.options.at(0).get('selected')).toBeTruthy();
      expect(this.view.options.at(1).get('selected')).toBeFalsy();
    });

    it("should set the .is-selected class on the selected item's DOM", function() {
      expect(this.innerHTML()).not.toMatch('is-selected.+data-index="1"');

      this.select(1);
      expect(this.innerHTML()).toMatch('is-selected.+data-index="1"');

      this.select(0);
      expect(this.innerHTML()).toMatch('is-selected.+data-index="0"');
      expect(this.innerHTML()).not.toMatch('is-selected.+data-index="1"');
    });
  });

  describe('on click .js-ok', function() {
    beforeEach(function() {
      spyOn(this.view, 'killEvent');
      spyOn(this.view, 'undelegateEvents');
      spyOn(this.view, 'delegateEvents');
      spyOn(this.view, 'close');
      
      this.selected = this.view.options.find(function(option) { return option.get('selected'); });
      spyOn(this.selected, 'saveToVis');
      this.deferred = $.Deferred();
      this.selected.saveToVis.and.returnValue(this.deferred.promise());
      
      this.view.$('.js-ok').click();
    });

    it('should kill event', function() {
      expect(this.view.killEvent).toHaveBeenCalled();
    });

    it('should stop listening on events while processing', function() {
      expect(this.view.undelegateEvents).toHaveBeenCalled();
    });

    it('should save selected privacy to visualization', function() {
      expect(this.selected.saveToVis).toHaveBeenCalled();
      expect(this.selected.saveToVis).toHaveBeenCalledWith(this.vis);
    });

    describe('given save finishes successfully', function() {
      beforeEach(function() {
        this.deferred.resolve();
      });
      
      it('should close the dialog', function() {
        expect(this.view.close).toHaveBeenCalled();
      });
    });

    describe('given save fails', function() {
      beforeEach(function() {
        this.deferred.reject('fail');
      });

      it('should enable save button again', function() {
        expect(this.view.delegateEvents).toHaveBeenCalled();
      });
    });
  });

  describe('on select password option', function() {
    beforeEach(function() {
      this.passwordOption = this.view.options.where({ privacy: 'PASSWORD' })[0];
      this.passwordOption.set('selected', true);
    });

    it('should render the password input field', function() {
      expect(this.innerHTML()).toContain('<input ');
    });

    describe('and the password field has no value', function() {
      beforeEach(function() {
        this.passwordOption.set('password', undefined);
      });
      
      it('should disable the save button', function() {
        expect(this.innerHTML()).toContain('is-disabled');
      });
    });

    describe('and the password has at least some char', function() {
      beforeEach(function() {
        this.passwordOption.set('password', 'f');
      });

      it('should not disable the save button', function() {
        expect(this.innerHTML()).not.toContain('is-disabled');
      });
    });
  });
});

