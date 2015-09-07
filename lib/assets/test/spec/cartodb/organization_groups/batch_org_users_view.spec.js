var cdb = require('cartodb.js');
var BatchOrgUsersView = require('../../../../javascripts/cartodb/organization_groups/batch_org_users_view');

describe('organization_groups/batch_org_users_view', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      id: 123,
      base_url: 'http://cartodb.com/user/paco',
      username: 'paco',
      organization: {
        id: 'o1',
        owner: {
          id: 123
        }
      }
    });
    this.orgUsers = this.user.organization.users;
    spyOn(this.orgUsers, 'fetch');

    this.processUsersSpy = jasmine.createSpy('processUsers')

    this.view = new BatchOrgUsersView({
      orgUsers: this.orgUsers,
      processUsers: this.processUsersSpy
    });
    this.view.render();
  });

  afterEach(function() {
    this.view.clean();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should fetch org users', function() {
    expect(this.orgUsers.fetch).toHaveBeenCalled();
  });

  it('should show loading users screen', function() {
    expect(this.innerHTML()).toContain('Loading users');
  });

  describe('when users fail to load', function() {
    beforeEach(function() {
      // Fake error triggered on collection
      this.orgUsers.trigger('error');
    });

    it('should show generic error msg', function() {
      expect(this.innerHTML()).toContain('error');
    });
  });

  describe('when users are loaded', function() {
    beforeEach(function() {
      // Fake success callback on fetch
      this.orgUsers.reset([{
        id: 'u1',
        username: 'pepe'
      }, {
        id: 'u2',
        'username': 'paco'
      }]);
    });

    it('should render the CTA to select users to add', function() {
      expect(this.view.$('.js-no-selected-users').attr('style')).not.toContain('display');
    });

    it('should not show add button', function() {
      expect(this.view.$('.js-add-selected-users').attr('style')).toContain('display: none');
    });

    it('should render the users', function() {
      expect(this.innerHTML()).toContain('pepe');
      expect(this.innerHTML()).toContain('paco');
    });

    describe('when pagination is changed', function() {
      beforeEach(function() {
        expect(this.orgUsers.getParameter('page')).toEqual(1);
        this.orgUsers.fetch.calls.reset();
        this.view.pagination.set('current_page', 2);
      });

      it('should fetch users with new page', function() {
        expect(this.orgUsers.getParameter('page')).toEqual(2);
        expect(this.orgUsers.fetch).toHaveBeenCalled();
      });

      it('should change state to loading', function() {
        expect(this.view.model.get('state')).toEqual('loading');
      });
    });

    describe('when at least 1 user is selected', function() {
      beforeEach(function() {
        this.view.$('li:first').click();
      });

      it('should render the CTA to select users to add', function() {
        expect(this.view.$('.js-no-selected-users').attr('style')).toContain('display: none');
      });

      it('should not show add button', function() {
        expect(this.view.$('.js-add-selected-users').attr('style')).not.toContain('display: none');
      });

      it('should render singular unless more than one is selected', function() {
        expect(this.innerHTML()).toContain('Add 1 user');
        this.view.$('li:last').click(); // also select 2nd item
        expect(this.innerHTML()).toContain('Add 2 users');
      });

      describe('when click on add users', function() {
        beforeEach(function() {
          this.view.$('.js-add-selected-users').click();
        });

        it('should change state to loading', function() {
          expect(this.view.model.get('state')).toEqual('loading');
          expect(this.view.model.get('loadingText')).toMatch('Adding');
        });

        it('should trigger a process-users event', function() {
          expect(this.processUsersSpy).toHaveBeenCalled();
        });

        it('should provide the selected users', function() {
          expect(this.processUsersSpy.calls.argsFor(0)[0]).toEqual([this.orgUsers.first()])
        });

        it('should provide an error callback', function() {
          var errCallback = this.processUsersSpy.calls.argsFor(0)[1];
          expect(errCallback).toEqual(jasmine.any(Function))
        });
      });
    });
  });
});
