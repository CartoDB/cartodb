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
      ],
      datasource: {
        user_name: "wadus",
        maps_api_template: "https://{user}.example.com:443",
        stat_tag: "ece6faac-7271-11e5-a85f-04013fc66a01",
        force_cors: true // This is sometimes set in the editor
      }
    };

    this.vis = new cdb.vis.Vis({el: this.container});
    this.vis.load(this.mapConfig);
  })

  describe("Torque time slider", function() {
    it ("should display the time slider if a torque layer is present", function(done) {
      this.mapConfig.layers = [
        {
          type: 'torque',
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
          type: 'torque',
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
