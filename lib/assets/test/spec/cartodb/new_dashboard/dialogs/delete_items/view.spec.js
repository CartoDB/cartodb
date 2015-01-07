var DeleteItems = require('new_dashboard/dialogs/delete_items/view');
var $ = require('jquery');
var Router = require('new_dashboard/router');
var cdbAdmin = require('cdb.admin');

describe('new_dashboard/dialogs/delete_items/view', function() {
  beforeEach(function() {
    this.collection = new cdbAdmin.Visualizations();

    this.router = new Router({
      rootUrl: ''
    });
    this.router.model.set('content_type', 'datasets');

    this.view = new DeleteItems({
      collection: this.collection,
      router:     this.router
    });

    this.view.render();
    this.html = function () {
      return this.view.el.innerHTML;
    }
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();

  });
  it('should not render any affected users block', function () {
    expect(this.html()).not.toContain('will loose access');
  });

  describe('given at least one selected item', function() {
    beforeEach(function() {
      this.collection.reset([
        { selected: true },
        { selected: false },
        { selected: true }
      ]);
      this.view.render();
    });

    it('should render a text with amount of items to be deleted', function() {
      expect(this.html()).toContain('delete 2 datasets');
      expect(this.html()).toContain('them'); // the object pronoun of the sentence
    });
    
    describe('and OK button is clicked', function() {
      beforeEach(function() {
        this.deferreds = [];
        this.collection.each(function(m, i) {
          this.deferreds[i] = $.Deferred();
          spyOn(m, 'destroy').and.returnValue(this.deferreds[i].promise());
        }, this);

        spyOn(this.view, 'hide');

        this.view.$('.js-ok').click();
      });

      it('should destroy selected items', function() {
        expect(this.collection.at(0).destroy).toHaveBeenCalled();
        expect(this.collection.at(2).destroy).toHaveBeenCalled();
      });

      it('should not remove items from collection until DELETE response comes back successfully', function() {
        expect(this.collection.at(0).destroy).toHaveBeenCalledWith(jasmine.objectContaining({ wait: true }));
        expect(this.collection.at(2).destroy).toHaveBeenCalledWith(jasmine.objectContaining({ wait: true }));
      });

      it('should NOT destroy unselected items', function() {
        expect(this.collection.at(1).destroy).not.toHaveBeenCalled();
      });

      it('should hide dialog but not until all items deleted', function() {
        // Still one pending after 1st resolve
        this.deferreds[0].resolve();
        expect(this.view.hide).not.toHaveBeenCalled();

        // 2nd resolve, all should be done
        this.deferreds[2].resolve();
        expect(this.view.hide).toHaveBeenCalled();
      });

      it('should TBD if any item cannot be deleted', function() {
        // 1st fails, so even if 2nd resolves should not hide view
        // TODO: How should errors be handled?
        this.deferreds[0].fail();
        this.deferreds[2].resolve();
        expect(this.view.hide).not.toHaveBeenCalled();
      });
    });
  });

  describe('given items are shared with other users', function () {
    beforeEach(function () {
      // Creates a permission object w/ 2 users
      var i = 1;
      var newPermission = function () {
        var newAclItem = function(opts) {
          return {
            type: 'user',
            entity: {
            id: opts.id,
              name: 'user name '+ opts.id
            },
            access: opts.access
          }
        };
        return new cdbAdmin.Permission({
          owner: {},
          acl: [
            newAclItem({ id: i++, access: 'r' }),
            newAclItem({ id: i++, access: 'rw' })
          ]
        })
      };
      this.collection.reset([
        {
          selected: true,
          permission: newPermission()
        },{
          // since it's not selected it should not be included in results!
          selected: true,
          permission: newPermission()
        },{
          selected: false,
          permission: newPermission()
        }
      ]);
      this.view.render();
    });

    it('should render block of affected users', function () {
      expect(this.html()).toContain("4 users will loose access");
    });

    it('should show avatars of a sample of the affected users', function () {
      expect(this.html()).toContain('user name 1');
      expect(this.html()).toContain('user name 3');
      
      // no more than 3 for now
      expect(this.html()).not.toContain('user name 4');
    });

    it('should show a "more" avatar representing that there are more users affected that are not displayed', function () {
      expect(this.html()).toContain('--moreItems');
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
