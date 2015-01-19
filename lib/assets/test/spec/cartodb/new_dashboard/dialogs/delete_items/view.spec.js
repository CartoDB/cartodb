// Mock default behaviour for dependency, re-apply explicitly for tests where we want to test this mixin.
window.skipDeleteItemsAsyncFetch = function() { throw new Error("Should have been overriden by DeleteItems") };
var DeleteItems = require('new_dashboard/dialogs/delete_items/view');
var $ = require('jquery');
var Router = require('new_dashboard/router');
var UserUrl = require('new_common/urls/user_model');
var cdbAdmin = require('cdb.admin');

describe('new_dashboard/dialogs/delete_items/view', function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      username: 'pepe'
    });
    this.router = new Router({
      currentUserUrl: new UserUrl({
        user: this.user
      })
    });
    this.router.model.set('content_type', 'datasets');

    this.user = new cdbAdmin.User({ id: 123, name: "pepe" });

    this.itemFetches = [];
    this.newItem = function() {
      return (function(_this) {
        return {
          sharedWith: function() {
            return [];
          },
          destroy: function() {},
          // This mocks the AsyncFetchBeforeRender functionality to test this separately
          tableMetadata: function() {
            return {
              fetch: function(fetchOpts) {
                _this.itemFetches.push(fetchOpts);
              },
              get: function() {}
            }
          }
        }
      })(this);
    };
  });

  describe('given async fetch on first render', function() {
    beforeEach(function() {
      this.selectedItems = [
        this.newItem(),
        this.newItem()
      ];

      this.view = new DeleteItems({
        selectedItems : this.selectedItems,
        router        : this.router
      });
      spyOn(this.view, 'render_content').and.callThrough();
      this.view.render();
    });

    describe('and fetch is in progress', function() {
      it('should render the default loading template', function() {
        expect(this.innerHTML()).toContain('Checking what consequences deleting the selected datasets would have...');
      });

      it('should not have rendered the original render just yet', function() {
        expect(this.view.render_content).not.toHaveBeenCalled();
      });
      
      afterEach(function() {
        // finish to void timeouts
        this.itemFetches.forEach(function(fetchOpts) {
          fetchOpts.success();
        });
      });
    });

    describe('and fetch finishes successfully', function() {
      beforeEach(function() {
        this.itemFetches.forEach(function(fetchOpts) {
          fetchOpts.success();
        });
      });

      it('should called the original render', function() {
        expect(this.view.render_content).toHaveBeenCalled();
      });

      it('should not render loader anymore', function() {
        expect(this.innerHTML()).not.toContain('Checking');
      });
    });

    describe('and at least one fetch fails', function() {
      beforeEach(function() {
        var self = this;
        this.originalTrackJs = window.trackJs;
        window.trackJs = {track: function(error) {
          self.trackedError = error;
        }};
        var i = 0;
        this.itemFetches.forEach(function(fetchOpts) {
          var modelThatChanged = {};
          var jqXHR = {
            responseText: 'something failed for '+ i++
          };
          fetchOpts.error(modelThatChanged, jqXHR);
        });
      });

      it('should rendered the default error template', function() {
        expect(this.innerHTML()).toContain('ouch');
        expect(this.innerHTML()).toContain('error');
      });

      it('should not have rendered the original render', function() {
        expect(this.view.render_content).not.toHaveBeenCalled();
      });

      it('should log error', function() {
        expect(this.trackedError).toContain('something failed');
      });
      
      afterEach(function() {
        window.trackJs = this.originalTrackJs;
      });
    });
  });
  
  describe('assuming async fetch on first render finished successfully', function() {
    beforeEach(function() {
      this.selectedItems = [
        this.newItem(),
        this.newItem()
      ];

      this.view = new DeleteItems({
        selectedItems: this.selectedItems,
        router: this.router,
        user: this.user
      });
      
      this.view.render();
      window.skipDeleteItemsAsyncFetch();
    });
    
    describe('and items are NOT shared with other users', function() {
      it('should have no leaks', function() {
        expect(this.view).toHaveNoLeaks();

      });
      it('should not render any affected users block', function () {
        expect(this.innerHTML()).not.toContain('will loose access');
      });

      it('should render a text with amount of items to be deleted', function() {
        expect(this.innerHTML()).toContain('You are about to delete 2 datasets');
        expect(this.innerHTML()).toContain('them'); // the object pronoun of the sentence
      });

      describe('and "OK, delete" button is clicked', function() {
        beforeEach(function() {
          this.saves = [];
          this.selectedItems.forEach(function(m) {
            jqXHR = jasmine.createSpyObj('jqXHR', ['done', 'fail']);
            jqXHR.done.and.returnValue(jqXHR);
            jqXHR.fail.and.returnValue(jqXHR);
            spyOn(m, 'destroy').and.returnValue(jqXHR);
            this.saves.push(jqXHR);
          }, this);
          spyOn(this.view, 'close').and.callThrough();
          spyOn(this.view, 'delegateEvents');
          spyOn(this.view, 'undelegateEvents');
          this.view.$('.js-ok').click();
        });

        describe('and while change are in process', function() {
          it('should disable click handler so user cannot click multiple times', function() {
            expect(this.view.undelegateEvents).toHaveBeenCalled();
          });
        });

        describe('and destroy is done successfully', function() {
          beforeEach(function() {
            this.saves.forEach(function(save) {
              save.done.calls.argsFor(0)[0]();
            }, this);
          });

          it('should not have been deleted from collection until response has returned', function() {
            this.selectedItems.forEach(function(m) {
              expect(m.destroy.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ wait: true }));
            });
          });

          it('should delete the dialog', function() {
            expect(this.view.close).toHaveBeenCalled();
          });
        });
        
        describe('and a set fails', function() {
          beforeEach(function() {
            this.saves[0].fail.calls.argsFor(0)[0]('b0rk it!');
          });

          it('should enable buttons again', function() {
            expect(this.view.delegateEvents).toHaveBeenCalled();
          });

          it('should leave dialog open', function() {
            expect(this.view.close).not.toHaveBeenCalled();
          });
        });
      });
    });

    describe('and items are shared with other users', function() {
      beforeEach(function () {
        var newUser = function(opts) {
          return new cdbAdmin.User({
            id: opts.id,
            name: 'user name '+ opts.id
          })
        };

        spyOn(this.selectedItems[0], 'sharedWith').and.returnValue([
          newUser({ id : 1 }),
          newUser({ id : 2 })
        ]);
        spyOn(this.selectedItems[1], 'sharedWith').and.returnValue([
          newUser({ id : 3 }),
          newUser({ id : 4 }),
          newUser({ id : 5 })
        ]);

        this.view.render();
      });

      it('should render block of affected users', function() {
        expect(this.innerHTML()).toContain('5 users will loose access');
      });

      it('should show avatars of a sample of the affected users', function() {
        expect(this.innerHTML()).toContain('user name 1');
        expect(this.innerHTML()).toContain('user name 2');
        expect(this.innerHTML()).toContain('user name 3');

        // no more than 3 for now
        expect(this.innerHTML()).not.toContain('user name 4');
        expect(this.innerHTML()).not.toContain('user name 5');
        expect(this.innerHTML()).not.toContain('user name 6');
      });

      it('should show a "more" avatar representing that there are more users affected that are not displayed', function () {
        expect(this.innerHTML()).toContain('--moreItems');
      });
    });

    describe('and there are affected maps', function() {
      beforeEach(function() {
        this.mapUrl = jasmine.createSpyObj('MapUrl', ['toEdit']);
        this.mapUrl.toEdit.and.returnValue('http://pepe.cartodb.com/viz/abc-123/map');
        this.router.currentUserUrl = jasmine.createSpyObj('UserUrl', ['mapUrl']);
        this.router.currentUserUrl.mapUrl.and.returnValue(this.mapUrl);

        var tableMetadata = jasmine.createSpyObj('Table metadata', ['get']);
        tableMetadata.get.and.returnValue([{
          id: "8b44c8ba-6fcf-11e4-8581-080027880ca6",
          name: "A walk",
          updated_at: "2015-01-13T10:16:09+00:00",
          permission: {
            id: "7a3946ab-166e-4f55-af75-6964daf11fb2",
            owner: {
              id: "c07440fd-5dc2-4c82-9d58-ac8ba5a06ddf",
              username: "development",
              avatar_url: "//gravatar.com/avatar/e28c025981d4f16551fff315fdffa498?s=128"
            }
          }
        }]);
        spyOn(this.selectedItems[1], 'tableMetadata').and.returnValue(tableMetadata);
        this.view.render();
      });

      it('should render affected map', function() {
        expect(this.innerHTML()).toContain('MapCard');
      });

      it('should be linked to open map in new window', function() {
        expect(this.innerHTML()).toContain('<a href="http://pepe.cartodb.com/viz/abc-123/map" target="_blank"');
      })
    });
  });

  afterEach(function() {
    this.view && this.view.clean();
  });
  
  afterAll(function() {
    window.skipDeleteItemsAsyncFetch = undefined;
    delete window.skipDeleteItemsAsyncFetch;
  });
});
