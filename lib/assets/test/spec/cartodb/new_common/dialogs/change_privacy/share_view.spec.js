var ShareView = require('../../../../../../javascripts/cartodb/new_common/dialogs/change_privacy/share_view');
var ViewModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/change_privacy/view_model');
var cdbAdmin = require('cdb.admin');

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The importat feature is the interactions and that view don't throw errors on render and updates.
 */
describe('new_common/dialogs/change_privacy/share_view', function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      username: 'pepe',
      actions: {},
      organization: {
        users: [{
          id: 'abc-123',
          username: 'paco'
        }]
      }
    });

    this.vis = new cdbAdmin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.createView = function() {
      this.viewModel = new ViewModel({
        vis: this.vis,
        user: this.user,
        upgradeUrl: this.upgradeUrl
      });
      spyOn(this.viewModel, 'changeState');
      spyOn(this.viewModel, 'save');

      this.view = new ShareView({
        viewModel: this.viewModel
      });
      spyOn(this.view, 'killEvent');

      this.view.render();
    };

    this.createView();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('given there is at least one dependant visualization', function() {
    beforeEach(function() {
      this.dependantUser = {
        id: 'abc-123'
      };
      spyOn(this.viewModel, 'usersUsingVis').and.returnValue([ this.dependantUser ]);
    });

    it('should render OK', function() {
      expect(this.view.render()).toBe(this.view);
    });

    it('should rendered users', function() {
      expect(this.innerHTML()).toContain('paco');
    });
  });

  describe('on click .js-save', function() {
    beforeEach(function() {
      this.view.$('.js-save').click();
    });

    it('should kill event', function() {
      expect(this.view.killEvent).toHaveBeenCalled();
    });

    it('should stop listening on events while processing', function() {
      expect(this.viewModel.save).toHaveBeenCalled();
    });
  });
});
