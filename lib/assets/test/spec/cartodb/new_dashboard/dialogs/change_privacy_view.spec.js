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
      }
    });
    
    this.vis = new cdbAdmin.Visualization({
      type: 'table',
      privacy: 'public'
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
    it('should render all privacy options except for public as disabled', function() {
      pending();
    });

    it('should render public as selected', function() {
      pending();
    });

    it('should render call-to-action to upgrade', function() {
      pending();
    });
  });
});

