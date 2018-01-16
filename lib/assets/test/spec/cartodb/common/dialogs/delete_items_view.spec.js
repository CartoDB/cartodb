// Mock default behaviour for dependency, re-apply explicitly for tests where we want to test this mixin.
var DeleteItems = require('../../../../../javascripts/cartodb/common/dialogs/delete_items_view');
var ViewModel = require('../../../../../javascripts/cartodb/common/dialogs/delete_items_view_model');
var cdbAdmin = require('cdb.admin');

describe('common/dialogs/delete_items_view', function () {
  beforeEach(function () {
    this.user = new cdbAdmin.User({
      base_url: 'http://pepe.carto.com',
      id: 123,
      name: 'pepe'
    });

    this.contentType = 'datasets';

    this.models = [];

    this.createView = function (callback) {
      this.viewModel = new ViewModel(this.models, {
        contentType: this.contentType
      });
      spyOn(this.viewModel, 'loadPrerequisites');
      spyOn(this.viewModel, 'errorMessage').and.returnValue('Some error');
      this.view = new DeleteItems({
        user: this.user,
        viewModel: this.viewModel
      });

      spyOn(this.view, '_loadMapPreviews');

      if (callback) {
        callback(this.view, this.viewModel);
      }
    };
  });

  it('should load prerequisites when creating the view', function () {
    this.createView();
    expect(this.viewModel.loadPrerequisites).toHaveBeenCalled();
  });

  it('should attempt to load the map previews after the rendering is done', function () {
    this.createView(function (view, model) {
      model.setState('LoadingPrerequisites');
      view.appendToBody();
    });

    expect(this.view._loadMapPreviews).toHaveBeenCalled();
  });

  describe('when loading prerequisites', function () {
    beforeEach(function () {
      this.createView();
      this.viewModel.setState('LoadingPrerequisites');
    });

    it('should show a message', function () {
      expect(this.innerHTML()).toContain('Checking what consequences deleting the selected datasets would have...');
    });

    describe('when loading prerequisites fails', function () {
      beforeEach(function () {
        this.viewModel.setState('LoadPrerequisitesFail');
      });

      it('should rendered the default error template', function () {
        expect(this.innerHTML()).toContain('ouch');
        expect(this.innerHTML()).toContain('error');
      });
    });

    describe('when loading prerequisities finished successfully', function () {
      beforeEach(function () {
        this.viewModel.setState('ConfirmDeletion');
      });

      it('should not render loader anymore', function () {
        expect(this.innerHTML()).not.toContain('Checking');
      });

      describe('when items are NOT shared with other users', function () {
        it('should not render any affected users block', function () {
          expect(this.innerHTML()).not.toContain('will lose access');
        });

        it('should render a text with amount of items to be deleted', function () {
          expect(this.innerHTML()).toContain('You are about to delete');
        });

        describe('when "OK, delete" button is clicked', function () {
          beforeEach(function () {
            spyOn(this.viewModel, 'deleteItems');
            spyOn(this.view, 'close').and.callThrough();
            this.view.$('.ok').click();
            this.viewModel.setState('DeletingItems');
          });

          it('should delete items', function () {
            expect(this.viewModel.deleteItems).toHaveBeenCalled();
          });

          describe('when deletion is done successfully', function () {
            beforeEach(function () {
              this.viewModel.setState('DeleteItemsDone');
            });

            it('should close the dialog', function () {
              expect(this.view.close).toHaveBeenCalled();
            });
          });

          describe('when deletion fails', function () {
            beforeEach(function () {
              this.viewModel.setState('DeleteItemsFail');
            });

            it('should show error message', function () {
              expect(this.innerHTML()).toContain('Some error');
            });
          });
        });
      });

      describe('when items are shared with other users', function () {
        beforeEach(function () {
          var newUser = function (opts) {
            return new cdbAdmin.User({
              id: opts.id,
              name: 'user name ' + opts.id
            });
          };
          spyOn(this.viewModel, 'affectedEntities').and.returnValue([
            newUser({ id: 1 }),
            newUser({ id: 2 }),
            newUser({ id: 3 }),
            newUser({ id: 4 })
          ]);

          this.viewModel.setState('ConfirmDeletion');
        });

        it('should render block of affected users', function () {
          expect(this.innerHTML()).toContain('Some users will lose access');
        });

        it('should show avatars of a sample of the affected users', function () {
          expect(this.innerHTML()).toContain('user name 1');
          expect(this.innerHTML()).toContain('user name 2');
          expect(this.innerHTML()).toContain('user name 3');

          // no more than 3 for now
          expect(this.innerHTML()).not.toContain('user name 4');
        });

        it('should show a "more" avatar representing that there are more users affected that are not displayed', function () {
          expect(this.innerHTML()).toContain('--moreItems');
        });
      });

      describe('when there are affected maps', function () {
        beforeEach(function () {
          spyOn(this.viewModel, 'affectedVisData').and.returnValue([
            {
              id: '8b44c8ba-6fcf-11e4-8581-080027880ca6',
              name: 'A walk',
              updated_at: '2015-01-13T10:16:09+00:00',
              auth_tokens: ['1234', '1234'],
              permission: {
                id: '7a3946ab-166e-4f55-af75-6964daf11fb2',
                owner: {
                  id: 'c07440fd-5dc2-4c82-9d58-ac8ba5a06ddf',
                  base_url: 'http://org.carto.com/u/development',
                  username: 'development',
                  avatar_url: '//gravatar.com/avatar/e28c025981d4f16551fff315fdffa498?s=128'
                }
              }
            }
          ]);

          this.viewModel.setState('ConfirmDeletion');
        });

        it('should render affected map', function () {
          expect(this.innerHTML()).toContain('MapCard');
        });

        it('should render the id of the visualization', function () {
          expect(this.innerHTML()).toContain('data-vis-id="8b44c8ba-6fcf-11e4-8581-080027880ca6"');
        });

        it('should be linked to open map in new window', function () {
          expect(this.innerHTML()).toContain('<a href="http://org.carto.com/u/development/viz/8b44c8ba-6fcf-11e4-8581-080027880ca6/map" target="_blank"');
        });
      });
    });
  });

  afterEach(function () {
    if (this.view) {
      this.view.clean();
    }
  });
});
