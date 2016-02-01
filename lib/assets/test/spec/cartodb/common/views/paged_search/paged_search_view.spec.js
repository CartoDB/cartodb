var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var PagedSearchView = require('../../../../../../javascripts/cartodb/common/views/paged_search/paged_search_view');
var PagedSearchModel = require('../../../../../../javascripts/cartodb/common/paged_search_model.js');

function keyPressEvent(key, metaKey) {
  var event = $.Event('keydown');
  event.which = key;
  event.keyCode = key;
  if (metaKey) {
    event.metaKey = true;
  }
  return event;
}

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The important feature is the interactions and that view don't throw errors on render and updates.
 */
describe('common/views/paged_search/paged_search_view', function() {
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

    this.organizationUsers = this.user.organization.users;

    var self = this;
    this.fakeUsersView = new cdb.core.View();
    this.fakeUsersView.render = function() {
      this.$el.html(
        'Users: ' + self.organizationUsers.map(function(m) {
          return m.get('username') + ', '
        })
      );
      return this;
    };
    this.createListViewSpy = jasmine.createSpy('createUsersView').and.callFake(function() {
      return self.fakeUsersView;
    });

    this.pagedSearchModel = new PagedSearchModel();
    spyOn(this.pagedSearchModel, 'fetch');

    this.view = new PagedSearchView({
      pagedSearchModel: this.pagedSearchModel,
      collection: this.organizationUsers,
      createListView: this.createListViewSpy
    });

    spyOn(this.view, 'killEvent');
    this.view.render();

    // Custom innerHTML helper, since all panes are rendered but hidden
    this.contentHTML = function() {
      return this.view._panes.getActivePane().$el.html();
    }
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have a tabs panel', function() {
    expect(this.view._panes).not.toBeUndefined();
    expect(_.size(this.view._panes._subviews)).toBe(4);
  });

  it('should fetch users', function() {
    expect(this.pagedSearchModel.fetch).toHaveBeenCalled();
  });

  describe('when view is intended to be used inside a dialog', function() {
    beforeEach(function() {
      this.view.clean();
      this.view = new PagedSearchView({
        isUsedInDialog: true,
        pagedSearchModel: this.pagedSearchModel,
        collection: this.organizationUsers,
        createListView: this.createListViewSpy
      });
      this.view.render();
    });

    it('should have no leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });

    it('should render the required .Dialog-* classes to position things as expected', function() {
      expect(this.view.$el.attr('class')).toContain('Dialog-');
      expect(this.innerHTML()).toContain('Dialog-');
    });
  });

  describe('when users are fetched', function() {
    beforeEach(function() {
      this.organizationUsers.sync = function(a,b,opts) {
        opts.success && opts.success({
          users: [{
            id: 'p1',
            username: 'pierre'
          }],
          total_entries: 1,
          total_user_entries: 77
        })
      };
      this.organizationUsers.fetch();
    });

    it('should create list view', function() {
      expect(this.createListViewSpy).toHaveBeenCalled();
      expect(this.contentHTML()).toContain('pierre');
    });
  });

  describe('when a search is initialized', function() {
    beforeEach(function() {
      this.pagedSearchModel.fetch.calls.reset();
      this.view._$searchInput().val('str');
      this.view.$('.js-search-input').trigger(keyPressEvent($.ui.keyCode.ENTER));
    });

    it('should call fetch on paged search model', function() {
      expect(this.pagedSearchModel.fetch).toHaveBeenCalledWith(this.organizationUsers);
    });

    it('should show searching', function() {
      expect(this.contentHTML()).toContain('Searching');
    });

    describe('when search returns an empty result', function() {
      beforeEach(function() {
        this.organizationUsers.sync = function(a,b,opts) {
          opts.success && opts.success({
            users: [],
            total_entries: 0,
            total_user_entries: 0
          })
        };
        this.organizationUsers.fetch();
      });

      it('should show no-results block', function() {
        expect(this.contentHTML()).toContain('No results');
      });
    });

    describe('when search is successfully done', function() {
      beforeEach(function() {
        this.createListViewSpy.calls.reset();
        this.organizationUsers.sync = function(a,b,opts) {
          opts.success && opts.success({
            users: [{
              id: 'abc-123',
              username: 'paco'
            }, {
              id: 'abc-456',
              username: 'pepe'
            }],
            total_entries: 2,
            total_user_entries: 2
          })
        };
        this.organizationUsers.fetch();
      });

      it('should show results', function() {
        expect(this.contentHTML()).toContain('pepe');
        expect(this.contentHTML()).toContain('paco');
      });

      it('should show clean search button', function() {
        expect(this.view.$('.js-clean-search').css('display')).not.toBe('none');
      });

      it('should update pagination model', function() {
        expect(this.view.paginationModel.get('total_count')).toEqual(2);
      });

      describe('when click clean search', function() {
        beforeEach(function() {
          this.view.$('.js-clean-search').click();
        });

        it('should reset search', function() {
          expect(this.view.$('.js-search-input').val()).toEqual('');
          expect(this.view.$('.js-clean-search').css('display')).not.toBe('none');
        });
      });

      describe('when click ESC on search input', function() {
        beforeEach(function() {
          this.view.$('.js-search-input').trigger(keyPressEvent($.ui.keyCode.ESCAPE));
        });

        it('should clear the search when user hits ESCAPE', function() {
          expect(this.view.$('.js-search-input').val()).toEqual('');
          expect(this.view.$('.js-clean-search').css('display')).not.toBe('none');
        });
      });
    });
  });

  describe('when pagination is changed', function() {
    beforeEach(function() {
      var states = [];
      this.view.paginationModel.set({
        current_page: 2
      });
    });

    it('should fetch a new page of organization users', function() {
      expect(this.pagedSearchModel.get('page')).toBe(2);
      expect(this.pagedSearchModel.fetch).toHaveBeenCalled();
    });
  });
});
