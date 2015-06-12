var SpatialMergeModel = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/spatial_merge/spatial_merge_model');

/**
 * Tests the flow of a spatial merge from start to end
 */
describe('common/dialog/merge_datasets/spatial_merge', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://pepe.cartodb.com'
    });
    var schema = [
      ['the_geom', 'geometry'],
      ['left_nr', 'number'],
      ['left_str', 'string']
    ];
    this.table = TestUtil.createTable('left table', schema);
    var model = new SpatialMergeModel({
      user: this.user,
      table: this.table,
      excludeColumns: []
    });

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

    this.model = model.firstStep();
    this.view = this.model.createView();
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should contain the left table name', function() {
    expect(this.innerHTML()).toContain('left table');
  });

  it('should contain the geom as key column', function() {
    expect(this.innerHTML()).toContain('the_geom');
  });

  describe('when right tables are fetched', function() {
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

        this.goDirectlyToNextStepSpy = jasmine.createSpy('change:goDirectlyToNextStepSpy');
        this.view.model.bind('change:goDirectlyToNextStep', this.goDirectlyToNextStepSpy);

        this.server.respond();
      });

      it('should go to next step directly', function() {
        expect(this.goDirectlyToNextStepSpy).toHaveBeenCalled();
      });

      it('should not have leaks', function() {
        expect(this.view).toHaveNoLeaks();
      });

      describe('when rendered 2nd step', function() {
        beforeEach(function() {
          this.model = this.model.nextStep();
          this.view.clean();
          this.view = this.model.createView();
          this.view.render();
        });

        it('should rendered merge methods for the right side', function() {
          expect(this.innerHTML()).toContain('sum');
          expect(this.innerHTML()).toContain('avg');
          expect(this.innerHTML()).toContain('count');
        });

        it('should not be ready for next step', function() {
          expect(this.model.get('isReadyForNextStep')).toBeFalsy();
        });

        describe('when selected a right merge column', function() {
          beforeEach(function() {
            this.model.get('rightColumns').at(0).set('selected', true);
          });

          it('should be ready for next step', function() {
            expect(this.model.get('isReadyForNextStep')).toBeTruthy();
          });
        });

        describe('when merge method is count', function() {
          beforeEach(function() {
            this.model.set('selectedMergeMethod', 'count');
          });

          it('should be ready for next step', function() {
            expect(this.model.get('isReadyForNextStep')).toBeTruthy();
          });
        });
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
