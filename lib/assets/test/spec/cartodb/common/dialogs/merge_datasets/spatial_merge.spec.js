var SpatialMergeModel = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/spatial_merge/spatial_merge_model');

/**
 * Tests the flow of a spatial merge from start to end
 */
describe('common/dialog/merge_datasets/spatial_merge', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://pepe.carto.com'
    });
    var schema = [
      ['the_geom', 'geometry'],
      ['left_nr', 'number'],
      ['left_str', 'string']
    ];
    this.table = TestUtil.createTable('a', schema);
    var model = new SpatialMergeModel({
      user: this.user,
      table: this.table,
      excludeColumns: ['excludethis']
    });

    this.server = sinon.fakeServer.create();

    // Should request visualization of type tables
    this.server.respondWith(/viz/, function(xhr) {
      xhr.respond(200, { 'Content-Type': 'application/json' },
        JSON.stringify({
          visualizations: [{
            id: 'cde-456',
            name: 'c',
            table: {
              id: 'c1',
              name: 'c'
            }
          }, {
            id: 'abc-123',
            name: 'b',
            table: {
              id: 'b1',
              name: 'b'
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

  it('should contain the left_table name', function() {
    expect(this.innerHTML()).toContain('>a</');
  });

  it('should contain the geom as key column', function() {
    expect(this.innerHTML()).toContain('the_geom');
  });

  describe('when right tables are fetched', function() {
    beforeEach(function() {
      this.server.respond();
    });

    it('should render them in tables list', function() {
      expect(this.innerHTML()).toContain('>b</');
      expect(this.innerHTML()).toContain('>c</');
    });

    describe('when selected a table', function() {
      beforeEach(function() {
        // Should request columns data for the selected table
        this.server.respondWith(/tables\/.+callback=([^&]+)/, function(xhr, callback) {
          xhr.respond(200, { 'Content-Type': 'application/json' },
            [callback, '(',
              JSON.stringify({
                id: 'b2',
                name: 'b',
                schema: [
                  ['the_geom', 'geometry'],
                  ['some_str', 'string'],
                  ['some_nr', 'number']
                ]
              }),
            ')'].join('')
          );
        });

        this.gotoNextStepSpy = jasmine.createSpy('change:gotoNextStep');
        this.view.model.bind('change:gotoNextStep', this.gotoNextStepSpy);

        this.view.$('.js-right-tables option')
          .last()
          .prop('selected', true)
          .trigger('change');
        this.server.respond();
      });

      it('should go to next step directly', function() {
        expect(this.gotoNextStepSpy).toHaveBeenCalled();
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

        describe('when selected a right merge column of type number', function() {
          beforeEach(function() {
            this.model.get('rightColumns').last().set('selected', true); // some_nr
            this.model.get('leftColumns').last().set('selected', true); // a.left_str in SQL below
          });

          it('should not be ready for next step', function() {
            expect(this.model.get('isReadyForNextStep')).toBeFalsy();
          });

          describe('when selected SUM merge method', function() {
            beforeEach(function() {
              this.model.get('mergeMethods').first().set('selected', true);
            });

            it('should be ready for next step', function() {
              expect(this.model.get('isReadyForNextStep')).toBeTruthy();
            });

            describe('when going to next step', function() {
              beforeEach(function() {
                spyOn(this.model.constructor, 'nextStep');
                this.model.nextStep();
              });

              it('should create next step w/ left table name', function() {
                expect(this.model.constructor.nextStep).toHaveBeenCalled();
                expect(this.model.constructor.nextStep.calls.argsFor(0)[0].tableName).toEqual('a');
              });

              it('should create next step w/ expected SQL', function() {
                expect(this.model.constructor.nextStep).toHaveBeenCalled();
                expect(this.model.constructor.nextStep.calls.argsFor(0)[0].sql).toEqual(
                  'SELECT a.cartodb_id, a.the_geom_webmercator, a.the_geom, a.left_str, (SELECT SUM(b.some_nr) FROM b WHERE ST_Intersects(a.the_geom, b.the_geom) ) AS intersect_sum FROM a'
                );
              });
            });
          });

          describe('when selected merge method is AVG', function() {
            beforeEach(function() {
              this.model.get('mergeMethods').at(2).set('selected', true);
            });

            it('should be ready for next step', function() {
              expect(this.model.get('isReadyForNextStep')).toBeTruthy();
            });

            describe('when going to next step', function() {
              beforeEach(function() {
                spyOn(this.model.constructor, 'nextStep');
                this.model.nextStep();
              });

              it('should create next step w/ left table name', function() {
                expect(this.model.constructor.nextStep).toHaveBeenCalled();
                expect(this.model.constructor.nextStep.calls.argsFor(0)[0].tableName).toEqual('a');
              });

              it('should create next step w/ expected SQL', function() {
                expect(this.model.constructor.nextStep).toHaveBeenCalled();
                expect(this.model.constructor.nextStep.calls.argsFor(0)[0].sql).toEqual(
                  'SELECT a.cartodb_id, a.the_geom_webmercator, a.the_geom, a.left_str, (SELECT AVG(b.some_nr) FROM b WHERE ST_Intersects(a.the_geom, b.the_geom) ) AS intersect_avg FROM a'
                );
              });
            });
          });
        });

        describe('when selected merge method is COUNT', function() {
          beforeEach(function() {
            this.model.get('mergeMethods').at(1).set('selected', true);
            this.model.get('leftColumns').last().set('selected', true); // a.left_str in SQL below
          });

          it('should be ready for next step', function() {
            expect(this.model.get('isReadyForNextStep')).toBeTruthy();
          });

          describe('when going to next step', function() {
            beforeEach(function() {
              spyOn(this.model.constructor, 'nextStep');
              this.model.nextStep();
            });

            it('should create next step w/ left table name', function() {
              expect(this.model.constructor.nextStep).toHaveBeenCalled();
              expect(this.model.constructor.nextStep.calls.argsFor(0)[0].tableName).toEqual('a');
            });

            it('should create next step w/ expected SQL', function() {
              expect(this.model.constructor.nextStep).toHaveBeenCalled();
              expect(this.model.constructor.nextStep.calls.argsFor(0)[0].sql).toEqual(
                'SELECT a.cartodb_id, a.the_geom_webmercator, a.the_geom, a.left_str, (SELECT COUNT(*) FROM b WHERE ST_Intersects(a.the_geom, b.the_geom) ) AS intersect_count FROM a'
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

  afterEach(function() {
    this.server.restore();
    this.view.clean();
  });
});
