var cdb = require('cartodb.js-v3');
var GrantablesView = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/grantables_view');
var ShareModel = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/share_model');
var PagedSearchModel = require('../../../../../../../javascripts/cartodb/common/paged_search_model');

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The important feature is the interactions and that view don't throw errors on render and updates.
 */
describe('common/dialogs/change_privacy/share/grantables_view', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      id: 'user-id',
      username: 'pepe',
      actions: {},
      organization: {
        id: 'org-id',
        users: [{
          id: 'abc-123',
          username: 'paco'
        },
        {
          id: 'abc-456',
          username: 'pepe'
        }]
      }
    });

    this.grantables = this.user.organization.grantables;
    this.grantables.sync = function(a,b,opts) {
      opts.success && opts.success({
        grantables: [{
          id: 'abc-123',
          type: 'user',
          model: {
            id: 'abc-123',
            username: 'paco'
          }
        },{
          id: 'abc-566',
          type: 'user',
          model: {
            id: 'abc-456',
            username: 'pepe'
          }
        },{
          id: 'g1',
          type: 'group',
          model: {
            id: 'g1',
            display_name: 'my group'
          }
        }],
        total_entries: 2,
        total_user_entries: 2
      })
    };
    this.grantables.fetch();

    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.viewModel = new ShareModel({
      vis: this.vis,
      organization: this.user.organization
    });

    this.pagedSearchModel = new PagedSearchModel();

    this.view = new GrantablesView({
      model: this.viewModel,
      collection: this.grantables,
      hasSearch: false,
      pagedSearchModel: this.pagedSearchModel
    });

    spyOn(this.view, 'killEvent');
    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when has search applied', function() {
    beforeEach(function() {
      this.pagedSearchModel.set('q', 'foo');
    });

    it('should not render the organization permission view', function() {
      expect(this.innerHTML()).not.toContain('Organization');
    });
  });

  describe('given there is at least one dependant visualization', function() {
    beforeEach(function() {
      this.dependantUser = { id: 'abc-123' };
      spyOn(this.vis.tableMetadata(), 'dependentVisualizations').and.returnValue([{permission: {owner: this.dependantUser}}]);
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
});
