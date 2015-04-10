describe('cdb.admin.mod.BubbleLegend', function() {
  beforeEach(function() {
    // Prevent API calls for related models
    spyOn(Backbone, 'sync');

    var table = TestUtil.createTable('test');
    var layer = new cdb.admin.CartoDBLayer();

    this.wizardProps = new cdb.admin.WizardProperties({
      table: table,
      layer: layer,

      // Take from real-life data...
      type: "bubble",
      property: "track_seg_point_id",
      qfunction: "Quantile",
      radius_min: 10,
      radius_max: 25,
      "marker-fill": "#FF5C00",
      "marker-opacity": 0.9,
      "marker-line-width": 1.5,
      "marker-line-color": "#FFF",
      "marker-line-opacity": 1,
      "marker-comp-op": "none",
      zoom: 15,
      geometry_type: "point",
      "text-placement-type": "simple",
      "text-label-position-tolerance": 10,
      metadata: [51,102,154,205,256,307,358,410,461,512]
    });

    this.legend = new cdb.admin.mod.BubbleLegend({
      model: {
        items: new Backbone.Collection()
      },
      wizardProperties: this.wizardProps
    });
  });

  describe('._calculateItems', function() {
    beforeEach(function() {
      this.legend._calculateItems();
    });

    it('should set bubble items with sync state set to false by default', function() {
      expect(this.legend.items.pluck('sync')).toEqual([false, false, undefined]);
    });

    it('should set bubble items with sync value based on previous state', function() {
      this.legend._calculateItems();
      expect(this.legend.items.pluck('sync')).toEqual([false, false, undefined]);

      // Changing individual items' sync state can be done through the form UI, through a checkbox "lock [x]"
      this.legend.items.at(1).set('sync', true);
      this.legend._calculateItems();
      expect(this.legend.items.pluck('sync')).toEqual([false, true, undefined]);

      this.legend.items.at(0).set('sync', true);
      this.legend._calculateItems();
      expect(this.legend.items.pluck('sync')).toEqual([true, true, undefined]);
    });

    it('should set label values from metadata', function() {
      expect(this.legend.items.at(0).get('value')).toEqual(51);
      expect(this.legend.items.at(1).get('value')).toEqual(512);
    });

    it('should update labels based only if sync state is disabled', function() {
      this.wizardProps.set('metadata', [1,2,3]);
      this.legend._calculateItems();
      expect(this.legend.items.at(0).get('value')).toEqual(1);
      expect(this.legend.items.at(1).get('value')).toEqual(3);

      this.legend.items.at(1).set('sync', true);
      this.legend.items.at(0).set('sync', true);
      this.wizardProps.set('metadata', [4,5,6]);
      this.legend._calculateItems();
      expect(this.legend.items.at(0).get('value')).toEqual(1);
      expect(this.legend.items.at(1).get('value')).toEqual(3);
    });
  });
});
