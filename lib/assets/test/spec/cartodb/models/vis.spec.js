
  //==================================================
  //
  //
  //
  //  THOSE TEST ARE **REALLY** IMPORTANT SO IF SOME 
  //  OF THEM IS BROKEN, PLEASE, TAKE CARE OF IT
  //
  //  Visualization model specs
  //  TODO: active_layer_id specs
  //  TODO: notices specs
  //
  //==================================================

  describe("Visualization model", function() {
    var vis, table, table_server;

    beforeEach(function() {

      cdb.admin.CartoDBLayer.updateCartoCss = function() {};

      // Visualization model
      vis = new cdb.admin.Visualization({
        map_id:           96,
        active_layer_id:  null,
        name:             "test_table",
        description:      "Visualization description",
        tags:             ["jamon","probando","test"],
        privacy:          "PUBLIC",
        updated_at:       "2013-03-04T18:09:34+01:00",
        isVisualization:  false
      });
    });

    /* map_id specs */

    /* isVisualization spec */
    describe('> isVisualization', function() {
      var cartodb_layer;

      beforeEach(function() {
        cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});
        
        vis.map.layers.reset([
          new cdb.geo.MapLayer(),
          cartodb_layer
        ]);
      });

      it("should return if the model is a visualization or a table", function() {
        expect(vis.isVisualization()).toBeFalsy();
        vis.set({
          'isVisualization': true
        },{
          silent: true
        });

        vis.map.layers.reset([
          new cdb.geo.MapLayer()
        ]);
        
        expect(vis.isVisualization()).toBeTruthy();
      });

      it("should be created from a one table visualization", function() {
        var old_map_id = vis.get('map_id');

        vis.set({ 
          'isVisualization': true
        });

        // Create new vis (empty)
        // Clone map layers
        // Clone map
        // Change new vis to new one

        expect('');
      });
    });


    /* name specs */
    describe('> name', function() {
      var cartodb_layer;

      beforeEach(function() {
        cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});
        
        vis.map.layers.reset([
          new cdb.geo.MapLayer(),
          cartodb_layer
        ]);
      });

      it("should set table layer name if there is only one data layer <==> table", function() {
        vis.set({
          'isVisualization': false
        },{
          silent: true
        });
                
        cartodb_layer.table.sync = function(a, b, opts) {
          opts.success({
            name: 'this_is_a_name'
          }, 200);
        }

        vis.map.layers.each(function(l){
          l.updateCartoCss = function() {};
        });

        vis.set('name', 'this is a name');
        expect(cartodb_layer.get('table_name')).toBe('this_is_a_name');
        expect(vis.get('name')).toBe('this_is_a_name');
      });

      it("shouldn't set table layer name if sync fails", function() {
        vis.set({
          'isVisualization': false
        },{
          silent: true
        });
                
        cartodb_layer.table.sync = function(a, b, opts) {
          opts.error({}, 404);
        }

        vis.map.layers.each(function(l){
          l.updateCartoCss = function() {};
        });

        vis.set('name', 'a visualization name');
        expect(cartodb_layer.get('table_name')).toBe('test_table');
        expect(vis.get('name')).toBe('test_table');
      });

      it("shouldn't set name if it is a visualization", function() {
        vis.map.layers.add(new cdb.admin.CartoDBLayer({ table_name: 'jam'}));
        
        vis.set({
          'isVisualization': true
        },{
          silent: true
        });

        cartodb_layer.table.sync = function(a, b, opts) {
          opts.error({}, 404);
        }

        spyOn(cartodb_layer.table, 'sync');

        vis.set('name', 'another name');

        expect(vis.map.getLayerAt(1).table.get('name')).not.toBe('another name');
        expect(vis.map.getLayerAt(2).table.get('name')).not.toBe('another name');
        expect(cartodb_layer.table.sync).not.toHaveBeenCalled();
      });
    });


    /* description specs */
    describe('> description', function() {
      var cartodb_layer;

      beforeEach(function() {
        cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});
        
        vis.map.layers.reset([
          new cdb.geo.MapLayer(),
          cartodb_layer
        ]);
      });

      it("should set table layer name if there is only one data layer <==> table", function() {
        cartodb_layer.table.set('description', 'hey description');
        vis.set({
          'isVisualization': false
        },{
          silent: true
        });
                
        cartodb_layer.table.sync = function(a, b, opts) {
          opts.success({
            description: 'this is a description'
          }, 200);
        }

        vis.set('description', 'this is a description');
        expect(vis.map.getLayerAt(1).table.get('description')).toBe('this is a description');
      });

      it("shouldn't set table layer name if sync fails", function() {
        cartodb_layer.table.set('description', 'Visualization description');
        vis.set('isVisualization', false);
                
        cartodb_layer.table.sync = function(a, b, opts) {
          opts.error({}, 404);
        }

        vis.set('description', 'this is a description');
        expect(vis.map.getLayerAt(1).table.get('description')).toBe('Visualization description');
        expect(vis.get('description')).toBe('Visualization description');
      });

      it("shouldn't set itself if there are at least 2 data layers", function() {
        vis.map.layers.add(new cdb.admin.CartoDBLayer({ table_name: 'test_table'}));

        vis.map.layers.each(function(l){
          if (l.table)
            l.table.set('description', 'desc example');
        });
        
        vis.set({
          'isVisualization': true
        },{
          silent: true
        });

        cartodb_layer.table.sync = function(a, b, opts) {
          opts.error({}, 404);
        }

        spyOn(cartodb_layer.table, 'sync');

        vis.set('description', 'another world');

        expect(vis.map.getLayerAt(1).table.get('description')).not.toBe('another world');
        expect(vis.map.getLayerAt(2).table.get('description')).not.toBe('another world');
        expect(cartodb_layer.table.sync).not.toHaveBeenCalled();
      });
    });


    /* tags specs */
    describe('> tags', function() {
      var cartodb_layer;

      beforeEach(function() {
        cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});
        
        vis.map.layers.reset([
          new cdb.geo.MapLayer(),
          cartodb_layer
        ]);
      });

      it("should set table layer tags if there is only one data layer <==> table", function() {
        cartodb_layer.table.set('tags', ['zurullo']);
        vis.set({
          'isVisualization': false
        },{
          silent: true
        });
                
        cartodb_layer.table.sync = function(a, b, opts) {
          opts.success({
            tags: ['zurullo']
          }, 200);
        }

        vis.set('tags', ['zurullo']);
        expect(vis.map.getLayerAt(1).table.get('tags').length).toBe(1);
        expect(vis.map.getLayerAt(1).table.get('tags')[0]).toBe('zurullo');
      });

      it("shouldn't set table layer tags if sync fails", function() {
        cartodb_layer.table.set('tags', ['eing']);
        vis.set({
          'isVisualization': false
        },{
          silent: true
        });
                
        cartodb_layer.table.sync = function(a, b, opts) {
          opts.error({}, 404);
        }

        vis.set('tags', ['esto', 'va', 'a', 'fallar']);
        
        expect(vis.map.getLayerAt(1).table.get('tags').length).toBe(1);
        expect(vis.map.getLayerAt(1).table.get('tags').toString()).toBe('eing');
        expect(vis.get('tags').length).toBe(3);
        expect(vis.get('tags').toString()).toBe("jamon,probando,test");
      });

      it("shouldn't set table layers tags if there are at least 2 data layers", function() {
        vis.map.layers.add(new cdb.admin.CartoDBLayer({ table_name: 'test_table'}));

        vis.map.layers.each(function(l){
          if (l.table)
            l.table.set('tags', ['i', 'love', 'this', 'game']);
        });
        
        vis.set({
          'isVisualization': true
        },{
          silent: true
        });

        cartodb_layer.table.sync = function(a, b, opts) {
          opts.error({}, 404);
        }

        spyOn(cartodb_layer.table, 'sync');

        vis.set('tags', ['ciruelo']);

        expect(vis.map.getLayerAt(1).table.get('tags').length).not.toBe(1);
        expect(vis.map.getLayerAt(2).table.get('tags').length).not.toBe(1);
        expect(cartodb_layer.table.sync).not.toHaveBeenCalled();
      });
    });


    /* privacy specs */
    describe('> privacy', function() {
      var cartodb_layer;

      beforeEach(function() {
        cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});
        
        vis.map.layers.reset([
          new cdb.geo.MapLayer(),
          cartodb_layer
        ]);
      });

      it("should set table layer privacy if there is only one data layer <==> table", function() {
        cartodb_layer.table.set('privacy', 'PUBLIC');
        vis.set({
          'isVisualization': false
        },{
          silent: true
        });
                
        cartodb_layer.table.sync = function(a, b, opts) {
          opts.success({
            privacy: 'PRIVATE'
          }, 200);
        }

        vis.set('privacy', 'PRIVATE');
        expect(cartodb_layer.table.get('privacy').toLowerCase()).toBe('private');
      });

      it("shouldn't set table layer privacy if sync fails", function() {
        cartodb_layer.table.set('privacy', 'PUBLIC');
        vis.set({
          'isVisualization': false
        },{
          silent: true
        });
                
        cartodb_layer.table.sync = function(a, b, opts) {
          opts.error({}, 404);
        }

        vis.set('privacy', 'PRIVATE');
        
        expect(cartodb_layer.table.get('privacy').toLowerCase()).toBe('public');
        expect(vis.get('privacy').toLowerCase()).toBe('public');
      });

      it("shouldn't set table layers privacy if there are at least 2 data layers", function() {
        vis.map.layers.add(new cdb.admin.CartoDBLayer({ table_name: 'test_table'}));

        vis.map.layers.each(function(l){
          if (l.table)
            l.table.set('privacy', 'PUBLIC');
        });
        
        vis.set({
          'isVisualization': true
        },{
          silent: true
        });

        cartodb_layer.table.sync = function(a, b, opts) {
          opts.error({}, 404);
        }

        spyOn(cartodb_layer.table, 'sync');

        vis.set('privacy', 'PRIVATE');

        expect(vis.map.getLayerAt(1).table.get('privacy').toLowerCase()).toBe('public');
        expect(vis.get('privacy').toLowerCase()).toBe('private');
        expect(cartodb_layer.table.sync).not.toHaveBeenCalled();
      });
    });
  });