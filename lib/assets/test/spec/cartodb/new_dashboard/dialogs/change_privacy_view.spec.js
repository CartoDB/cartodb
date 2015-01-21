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
        private_maps: false
      }
    });
    
    this.vis = new cdbAdmin.Visualization({
      type: 'table',
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

  describe('click .js-option', function() {
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
});

