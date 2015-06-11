var $ = require('jquery');
var _ = require('underscore');
var MergeDatasetsView = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/merge_datasets_view');

describe('common/dialog/merge_datasets/merge_datasets_view', function() {
  beforeEach(function() {
    var schema = [
      ['the_geom', 'geometry'],
      ['test', 'number'],
      ['test2', 'string']
    ];
    this.table = TestUtil.createTable('first table', schema);
    this.user = new cdb.admin.User({
      base_url: 'http://cartodb.com'
    });

    this.view = new MergeDatasetsView({
      table: this.table,
      user: this.user
    });
    this.view.render();
  });

  it('should display start view', function() {
    expect(this.innerHTML()).toContain('js-flavors');
    expect(this.innerHTML()).not.toContain('js-details');
  });

  describe('when column merge is clicked', function() {
    beforeEach(function() {
      $(this.view.$('.OptionCard')[0]).click();
    });

    it('should render the next view', function() {
      expect(this.innerHTML()).not.toContain('js-flavors');
      expect(this.innerHTML()).toContain('js-details');
    });

    describe('when click back', function() {
      beforeEach(function() {
        this.view.$('.js-back').click();
      });

      it('should display start view again', function() {
        expect(this.innerHTML()).toContain('js-flavors');
        expect(this.innerHTML()).not.toContain('js-details');
      });
    });

    it('should render columns of first table', function() {
      expect(this.innerHTML()).toContain('test');
      expect(this.innerHTML()).toContain('test2');
    });

    it('should not render the_geom column', function() {
      expect(this.innerHTML()).not.toContain('the_geom');
    });

    it('should have next button disabled', function() {
      expect(this.view.$('.js-next').hasClass('is-disabled')).toBeTruthy();
    });

    describe('when a table is selected', function() {
      beforeEach(function() {
        // Called by the table selector view
        this.tableData = {
          name: 'right table name'
        };
        spyOn(this.view.model.get('currentStep'), 'fetchRightColumns');
        _.values(this.view._subviews)[0]._onChangeRightTableData(undefined, this.tableData);
      });

      it('should call to fetch corresponding right columns', function() {
        expect(this.view.model.get('currentStep').fetchRightColumns).toHaveBeenCalled();
      });

      describe('when right columns are fetched', function() {
        beforeEach(function() {
          var currentStep = this.view.model.get('currentStep');
          currentStep.get('rightColumns').reset([{
            name: 'the_geom',
            type: 'geometry'
          }, {
            name: 'right-column-1',
            type: 'string'
          }, {
            name: 'right-column-2',
            type: 'number'
          }]);
        });

        it('should render the right columns', function() {
          expect(this.innerHTML()).toContain('right-column');
        });

        it('should not render the_geom column for right columns either', function() {
          expect(this.innerHTML()).not.toContain('the_geom');
        });

        describe('when selected a column from both lists', function() {
          beforeEach(function() {
            $(this.view.$('.js-left-columns .RadioButton')[1]).click();
            $(this.view.$('.js-right-columns .RadioButton')[1]).click();
          });

          it('should enable next button', function() {
            expect(this.view.$('.js-next').hasClass('is-disabled')).toBeFalsy();
          });

          describe('when click next step', function() {
            beforeEach(function() {
              this.view.$('.js-next').click();
            });

            it('should render the seleted tables as pre-selected', function() {
              expect(this.innerHTML()).toContain('first table');
              expect(this.innerHTML()).toContain('right table');
            });

            it('should show the geom columns since they should be selectable now', function() {
              expect(this.innerHTML()).toContain('the_geom');
            });

            it('should have next button enabled already', function() {
              expect(this.view.$('.js-next').hasClass('is-disabled')).toBeFalsy();
            });
          });
        });
      });
    });
  });

  describe('when spatial merge is clicked', function() {
    beforeEach(function() {
      this.server = sinon.fakeServer.create();

      // Should request visualization of type tables
      this.server.respondWith(/viz/, function(xhr) {
        xhr.respond(200, { 'Content-Type': 'application/json' },
          JSON.stringify({
            visualizations: [{
              id: 'abc-123',
              name: 'table A',
              table: {
                id: 'a1',
                name: 'table A'
              }
            }, {
              id: 'cde-456',
              name: 'table B',
              table: {
                id: 'b2',
                name: 'table B'
              }
            }]
          })
        );
      });
      $(this.view.$('.OptionCard')[1]).click();
    });

    it('should render the next view', function() {
      expect(this.innerHTML()).not.toContain('js-flavors');
      expect(this.innerHTML()).toContain('js-details');
    });

    describe('when tables are retrieved', function() {
      beforeEach(function() {
        this.server.respond();
      });

      it('should render them in tables list', function() {
        expect(this.innerHTML()).toContain('table A');
        expect(this.innerHTML()).toContain('table B');
      });

      describe('when selecting a table', function() {
        beforeEach(function() {
          // Should request columns data for the selected table
          this.server.respondWith(/tables\/.+callback=([^&]+)/, function(xhr, callback) {
            xhr.respond(200, { 'Content-Type': 'application/json' },
              [callback, '(',
                JSON.stringify({
                  id: 'b2',
                  name: 'table name',
                  schema: [
                    ['the_geom', 'geometry'],
                    ['some_str', 'string'],
                    ['some_nr', 'number']
                  ]
                }),
              ')'].join('')
            );
          });

          var $select = this.view.$('.js-right-tables');
          $select.children().last().prop('selected', true);
          $select.trigger('change');
          this.server.respond();
        });

        it('should go to next step directly', function() {
          expect(this.innerHTML()).toContain('js-right-columns');
        });
      });
    });
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });
});
