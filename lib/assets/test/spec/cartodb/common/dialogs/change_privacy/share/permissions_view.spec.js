var PermissionsView = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/permissions_view');
var ShareModel = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/share_model');
var cdbAdmin = require('cdb.admin');
var $ = require('jquery');

function keyPressEvent(key, metaKey) {
  var event = $.Event("keydown");
  event.which = key;
  event.keyCode = key;
  if (metaKey) {
    event.metaKey = true;
  }
  return event;
}

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The importat feature is the interactions and that view don't throw errors on render and updates.
 */
describe('common/dialogs/change_privacy/share/permissions_view', function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      username: 'pepe',
      actions: {},
      organization: {
        users: [
          {
            id: 'abc-123',
            username: 'paco'
          },
          {
            id: 'abc-456',
            username: 'pepe'
          }
        ]
      }
    });

    this.vis = new cdbAdmin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.viewModel = new ShareModel({
      vis: this.vis,
      organization: this.user.organization
    });

    this.view = new PermissionsView({
      model: this.viewModel
    });
    spyOn(this.view, 'killEvent');

    this.view.render();
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

    it('should render default settings for the organization', function() {
      expect(this.innerHTML()).toContain('Default settings for your Organization');
    });

    it('should render users', function() {
      expect(this.innerHTML()).toContain('paco');
      expect(this.innerHTML()).toContain('pepe');
    });
  });

  describe('filtering users', function() {

    it('should re-render when then the search changes', function() {
      expect(this.innerHTML()).toContain('pepe');
      expect(this.innerHTML()).toContain('paco');

      this.viewModel.set('search', 'pepe');

      expect(this.innerHTML()).toContain('pepe');
      expect(this.innerHTML()).not.toContain('paco');
    });

    it('should update the search when a search is submitted', function() {
      this.view.$('.js-search-input').val('pepe');
      this.view.$('.js-search-input').trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(this.viewModel.get('search')).toEqual('pepe');
    });

    it('should NOT render default settings for the organization when showing search results', function() {
      expect(this.innerHTML()).toContain('Default settings for your Organization');

      this.viewModel.set('search', 'pepe');

      expect(this.innerHTML()).not.toContain('Default settings for your Organization');
    });

    it('should clear the search when users clicks X', function() {
      this.viewModel.set('search', 'pepe');

      this.view.$('.js-clean-search').click();

      expect(this.viewModel.get('search')).toEqual('');
    });

    it('should clear the search when user hits ESCAPE', function() {
      this.viewModel.set('search', 'pepe');

      this.view.$('.js-search-input').trigger(keyPressEvent($.ui.keyCode.ESCAPE));

      expect(this.viewModel.get('search')).toEqual('');
    });
  });
});
