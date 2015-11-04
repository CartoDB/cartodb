var $ = require('jquery');
var _ = require('underscore');

describe('vis/vis', function() {

  beforeEach(function(){
    this.container = $('<div>').css('height', '200px');
    this.mapConfig = {
      updated_at: 'cachebuster',
      title: "irrelevant",
      url: "http://cartodb.com",
      center: [40.044, -101.95],
      bounding_box_sw: [20, -140],
      bounding_box_ne: [ 55, -50],
      zoom: 4,
      bounds: [
        [1, 2],
        [3, 4],
      ]
    };

    this.vis = new cdb.vis.Vis({el: this.container});
    this.vis.load(this.mapConfig);
  })

  describe("Torque time slider", function() {
    it ("should display the time slider if a torque layer is present", function(done) {
      this.mapConfig.layers = [
        {
          kind: 'torque',
          options: { user_name: 'test', table_name: 'test', tile_style: 'Map { -torque-frame-count: 10;} #test { marker-width: 10; }'}
        }
      ];

      this.vis.load(this.mapConfig).done(function(vis, layers){
        expect(vis.timeSlider).toBeDefined();
        done();
      });
    });

    it ("should NOT display the time slider if a torque layer is not visible", function(done) {
      this.mapConfig.layers = [
        {
          kind: 'torque',
          visible: false,
          options: { user_name: 'test', table_name: 'test', tile_style: 'Map { -torque-frame-count: 10;} #test { marker-width: 10; }'}
        }
      ];

      this.vis.load(this.mapConfig).done(function(vis, layers){
        expect(vis.timeSlider).toBeUndefined();
        done();
      });
    });
  })
});
