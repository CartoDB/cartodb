var ShareView = require('new_dashboard/dialogs/change_privacy/share_view');
var cdbAdmin = require('cdb.admin');

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The importat feature is the interactions and that view don't throw errors on render and updates.
 */
describe('new_dashboard/dialogs/change_privacy/share_view', function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      username: 'pepe',
      organization: {
      }
    });
    
    this.vis = new cdbAdmin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.view = new ShareView({
      vis: this.vis,
      organization: this.user.organization
    });
    this.view.render(); 
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('on click .js-back', function() {
    beforeEach(function() {
      spyOn(this.view, 'killEvent');
      spyOn(this.view, 'trigger');

      this.view.$('.js-back').click();
    });

    it('should kill event', function() {
      expect(this.view.killEvent).toHaveBeenCalled();
    });

    it('should fire a click:back event', function() {
      expect(this.view.trigger).toHaveBeenCalledWith('click:back');
    });
  });
});

