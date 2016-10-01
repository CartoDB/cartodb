var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var ColumnMergeModel = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/column_merge/column_merge_model');

/**
 * Tests the flow of a column merge from start to end
 */
describe('common/dialog/merge_datasets/column_merge', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://pepe.carto.com'
    });
    var schema = [
      ['left_nr', 'number'],
      ['left_str', 'string'],
      ['the_geom', 'geometry']
    ];
    this.table = TestUtil.createTable('a', schema);
    this.columnMergeModel = new ColumnMergeModel({
      user: this.user,
      table: this.table,
      excludeColumns: ['excludethis']
    });

    this.model = this.columnMergeModel.firstStep();
    this.view = this.model.createView();
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should contain the left_table name', function() {
    expect(this.innerHTML()).toContain('>a</');
  });

  it('should not render the_geom column', function() {
    expect(this.innerHTML()).not.toContain('the_geom');
  });

  describe('.isAvailable', function() {
    it('should only return true if there is at least one available column', function() {
      expect(this.columnMergeModel.isAvailable()).toBeTruthy();

      var otherModel = new ColumnMergeModel({
        user: this.user,
        table: TestUtil.createTable('a', [['the_geom', 'geometry'], ['exclude_this', 'string']]),
        excludeColumns: ['exclude_this']
      });
      expect(otherModel.isAvailable()).toBeFalsy();
    });
  });

  describe('when a table is selected', function() {
    beforeEach(function() {
      // Called by the table selector view
      this.tableData = {
        name: 'b'
      };
      spyOn($, 'ajax');
      spyOn(this.model, 'changeRightTable').and.callThrough();
      this.view._onChangeRightTableData(undefined, this.tableData);
    });

    it('should call to fetch corresponding right columns', function() {
      expect(this.model.changeRightTable).toHaveBeenCalled();
    });

    describe('when right columns are fetched', function() {
      beforeEach(function() {
        this.model.get('rightColumns').reset([{
          name: 'right_nr',
          type: 'number'
        }, {
          name: 'right_str',
          type: 'string'
        }, {
          name: 'the_geom',
          type: 'geometry'
        }]);
      });

      it('should render the right columns', function() {
        expect(this.innerHTML()).toContain('right_str');
        expect(this.innerHTML()).toContain('right_nr');
      });

      it('should not render the_geom column for right columns either', function() {
        expect(this.innerHTML()).not.toContain('the_geom');
      });

      it('should not be ready for next step yet', function() {
        expect(this.model.get('isReadyForNextStep')).toBeFalsy();
      });

      describe('when selected a key column from both lists', function() {
        beforeEach(function() {
          $(this.view.$('.js-left-columns .RadioButton')[1]).click(); // left_str
          $(this.view.$('.js-right-columns .RadioButton')[1]).click(); //right_str
        });

        it('should be ready for next step', function() {
          expect(this.model.get('isReadyForNextStep')).toBeTruthy();
        });

        describe('when select a column of different kind on left', function() {
          beforeEach(function() {
            $(this.view.$('.js-left-columns .RadioButton')[0]).click(); // left_nr
          });

          it('should unselect the item on the right', function() {
            expect(this.view.$('.js-right-columns .is-selected').length).toEqual(0);
            expect(this.view.$('.js-left-columns .is-selected').length).toEqual(1);
          });

          it('should not be ready for next step anymore', function() {
            expect(this.model.get('isReadyForNextStep')).toBeFalsy();
          });
        });

        describe('when going to next step', function() {
          beforeEach(function() {
            this.view.clean(); // cleanup prev
            this.model = this.model.nextStep();
            this.view = this.model.createView();
            this.view.render();
          });

          it('should render the seleted tables as pre-selected', function() {
            expect(this.innerHTML()).toContain('>a</');
            expect(this.innerHTML()).toContain('>b</');
          });

          it('should show the geom columns since they should be selectable now', function() {
            expect(this.innerHTML()).toContain('the_geom');
          });

          it('should sort the columns in alphabetically', function() {
            expect(this.model.get('leftColumns').pluck('name')).toEqual(['the_geom', 'left_nr', 'left_str']);
            expect(this.model.get('rightColumns').pluck('name')).toEqual(['the_geom', 'right_nr', 'right_str']);
          });

          it('should be ready for next step', function() {
            expect(this.model.get('isReadyForNextStep')).toBeTruthy();
          });

          describe('when go to next step', function() {
            beforeEach(function() {
              spyOn(this.model.constructor, 'nextStep');
              this.model.nextStep();
            });

            it('should create next step w/ left table name', function() {
              expect(this.model.constructor.nextStep).toHaveBeenCalled();
              expect(this.model.constructor.nextStep.calls.argsFor(0)[0].tableName).toEqual('a');
            });

            it('should generate the SQL based on prior selections', function() {
              // Detailed testing done in specific test case for the SQL generator
              expect(this.model.constructor.nextStep.calls.argsFor(0)[0].sql).toEqual(
                'SELECT CASE WHEN a.the_geom IS NULL THEN b.the_geom ELSE a.the_geom END AS the_geom, a.left_nr, a.left_str, b.right_nr, b.right_str FROM a FULL OUTER JOIN b ON LOWER(TRIM(a.left_str)) = LOWER(TRIM(b.right_str))'
              );
            });

            it('should pass the user model through', function() {
              expect(this.model.constructor.nextStep.calls.argsFor(0)[0].user).toBe(this.user);
            });
          });
        });
      });
    });
  });
});
