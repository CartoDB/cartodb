var ShareView = require('../../../../../../javascripts/cartodb/new_dashboard/dialogs/change_privacy/share_view');
var cdbAdmin = require('cdb.admin');

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The importat feature is the interactions and that view don't throw errors on render and updates.
 */
describe('new_dashboard/dialogs/change_privacy/share_view', function() {
  beforeEach(function() {
    this.permission = new cdbAdmin.Permission();
    this.org = new cdbAdmin.Organization({
      users: [{
        id: 'abc-123',
        username: 'pepe'
      }]
    });
    this.tableMetadata = new cdbAdmin.CartoDBTableMetadata();

    this.view = new ShareView({
      organization: this.org,
      permission: this.permission,
      tableMetadata: this.tableMetadata
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

  describe('given there is at least one dependant visualization', function() {
    beforeEach(function() {
      this.visData = {
        permission: {
          owner: {
            id: 'abc-123'
          }
        }
      };
      this.tableMetadata.set('dependent_visualizations', [ this.visData ]);
    });

    it('should render OK', function() {
      expect(this.view.render()).toBe(this.view);
    });

    it('should rendered users', function() {
      this.view.render();
      expect(this.innerHTML()).toContain('pepe');
    });
  });
});
