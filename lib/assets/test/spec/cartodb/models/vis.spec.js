
  //==================================================
  //
  //
  //
  //  THOSE TEST ARE **REALLY** IMPORTANT SO IF SOME
  //  OF THEM IS BROKEN, PLEASE, TAKE CARE OF IT
  //
  //  Visualization model specs
  //
  //==================================================

  describe("Visualization model", function() {
    var vis, table, table_server, map_id;

    beforeEach(function() {

      cdb.admin.CartoDBLayer.updateCartoCss = function() {};

      map_id = 96;

      // Visualization model
      vis = new cdb.admin.Visualization({
        map_id:           map_id,
        active_layer_id:  null,
        name:             "test_table",
        description:      "Visualization description",
        tags:             ["jamon","probando","test"],
        privacy:          "PUBLIC",
        updated_at:       "2013-03-04T18:09:34+01:00",
        type:             "table"
      });
    });

    /* defaults & config */
    describe('> defaults & config', function() {

      it("should define a number of ITEMS_PER_PAGE", function() {
        expect(cdb.admin.Visualizations.prototype._ITEMS_PER_PAGE).toBeDefined();
      });

      it("should define a number of PREVIEW_ITEMS_PER_PAGE", function() {
        expect(cdb.admin.Visualizations.prototype._PREVIEW_ITEMS_PER_PAGE).toBeDefined();
      });

      it("should setup map bindings by default", function() {
        expect(vis.get("bindMap")).toBeTruthy();
        expect(vis.map.get("id")).toEqual(map_id);
      });

      it("shouldn't setup map bindings when bindMap is false", function() {

        vis = new cdb.admin.Visualization({
          map_id:  map_id,
          bindMap: false
        });

        expect(vis.get("bindMap")).toBeFalsy();
        expect(vis.map.get("id")).toEqual(undefined);

      });

    });

    describe('> related tables', function() {

      it("should generate related_tables collection if related_tables attribute exists", function() {
        var new_vis = new cdb.admin.Visualization({
          map_id:           map_id,
          active_layer_id:  null,
          name:             "test_table",
          description:      "Visualization description",
          tags:             ["jamon","probando","test"],
          privacy:          "PUBLIC",
          updated_at:       "2013-03-04T18:09:34+01:00",
          type:             "derived",
          related_tables:   [{ id: "hello", "table_name": "hello", "privacy": "PRIVATE" }]
        });

        expect(new_vis.related_tables).toBeDefined();
        expect(new_vis.related_tables.size()).toBe(1);
      });

      it("shouldn't generate related_tables collection if visualization is a table type", function() {
        var new_vis = new cdb.admin.Visualization({
          map_id:           map_id,
          active_layer_id:  null,
          name:             "test_table",
          description:      "Visualization description",
          tags:             ["jamon","probando","test"],
          privacy:          "PUBLIC",
          updated_at:       "2013-03-04T18:09:34+01:00",
          type:             "table",
          related_tables:   [{ id: "hello", "table_name": "hello", "privacy": "PRIVATE" }]
        });

        expect(new_vis.related_tables).not.toBeDefined();
      });

      it("should generate related_tables collection if it is required by the user", function() {
        // Visualization model
        var new_vis = new cdb.admin.Visualization({
          map_id:           map_id,
          active_layer_id:  null,
          name:             "test_table",
          description:      "Visualization description",
          tags:             ["jamon","probando","test"],
          privacy:          "PUBLIC",
          updated_at:       "2013-03-04T18:09:34+01:00",
          type:             "derived",
          id:               5
        });

        var server = sinon.fakeServer.create();
        new_vis.getRelatedTables();

        server.respondWith('/api/v1/viz/5', [200, { "Content-Type": "application/json" }, '{ "related_tables": [{ "table_name": "jamon", "privacy": "PRIVATE" }] }']);
        server.respond();

        expect(new_vis.related_tables).toBeDefined();
        expect(new_vis.related_tables.size()).toBe(1);
      });

      it("related_tables should be regenrated when a new layer is added and saved", function() {
        spyOn(vis, 'getRelatedTables');
        var layer = new cdb.geo.MapLayer()
        vis.map.layers.add(layer);
        expect(vis.getRelatedTables).not.toHaveBeenCalled();
        layer.set('id', 1);
        expect(vis.getRelatedTables).toHaveBeenCalledWith(null, { force: true });
      });

      it("related_tables should be regenrated when a layer is removed", function() {
        var layer = new cdb.geo.MapLayer()
        vis.map.layers.add(layer);
        spyOn(vis, 'getRelatedTables');
        vis.map.layers.remove(layer);
        expect(vis.getRelatedTables).toHaveBeenCalledWith(null, { force: true });
      });
    });

    /* map_id specs */
    describe('> map_id', function() {

      it("should set bindMap to false for all visualizations on parse/fetch", function() {
        var visualizations = new cdb.admin.Visualizations({ type: "derived" });
        var v = visualizations.parse({total_entries: 1, visualizations: [{ id: 1 }]});
        expect(v[0].bindMap).toBeFalsy();

      });

    });

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
          "type": "derived"
        });

        vis.map.layers.reset([
          new cdb.geo.MapLayer()
        ]);

        expect(vis.isVisualization()).toBeTruthy();
      });
    });

    /* transform to visualization specs */
    describe('> transform to visualization', function() {
      var cartodb_layer, map_payload;

      beforeEach(function() {
        cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});
        map_payload = {
            id: 69,
            bounding_box_ne: "[]",
            bounding_box_sw: "[]",
            view_bounds_ne: "[]",
            view_bounds_sw: "[]",
            center: "[]"
        };

        vis.map.layers.reset([
          new cdb.geo.MapLayer(),
          cartodb_layer
        ]);
      });

      it("should copy correctly", function() {
        var c = vis.copy();
        expect(c.get('source_visualization_id')).toEqual(vis.id);
      });

      it("should change to", function() {
        vis.changeTo(new cdb.admin.Visualization({
          map_id: 'raboquetecomes',
          id: 'unzupo'
        }));
        expect(vis.map.id).toEqual("raboquetecomes");
        expect(vis.id).toEqual("unzupo");
      })
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

      // ALREADY DONE IN THE SERVER SIDE
      // 
      // it("should set table layer name if there is only one data layer <==> table", function() {
      //   vis.set({
      //     'derived': false
      //   },{
      //     silent: true
      //   });

      //   cartodb_layer.table.sync = function(a, b, opts) {
      //     opts.success({
      //       name: 'this_is_a_name'
      //     }, 200);
      //   }

      //   vis.map.layers.each(function(l){
      //     l.updateCartoCss = function() {};
      //   });

      //   vis.set('name', 'this is a name');
      //   expect(cartodb_layer.get('table_name')).toBe('this_is_a_name');
      //   expect(vis.get('name')).toBe('this_is_a_name');
      // });

      // it("should set name of the table when the visualization name changes", function() {
      //   vis.set({ 'type': 'table' },{ silent: true });
      //   vis.set('name', 'ola_ke_ase');
      //   cartodb_layer.table.sync = function(a, b, opts) {
      //     opts.success({'name': 'ola_ke_ase'}, 200);
      //   }
      //   expect(cartodb_layer.table.get('name')).toEqual('ola_ke_ase');
      // });

      it("should fetch cartodb layer if the table name has changed", function() {
        vis.set({
          'type': 'table'
        },{
          silent: true
        });

        var called = false;

        cartodb_layer.fetch = function(a, b, opts) {
          called = true;
        }

        vis.map.layers.each(function(l){
          l.updateCartoCss = function() {};
        });

        vis.set('name', 'a visualization name');
        expect(called).toBeTruthy();
      });

      // THIS IS NOT HAPPENING ANYMORE, IF FAILS 
      // SET ATTRIBUTE FUNCTION IS NOT BEING CALLED
      // AND, OF COURSE, DONE IN THE SERVER SIDE :)

      // it("shouldn't set table layer name if sync fails", function() {
      //   vis.set({
      //     'type': 'table'
      //   },{
      //     silent: true
      //   });

      //   cartodb_layer.table.sync = function(a, b, opts) {
      //     opts.error({}, 404);
      //   }

      //   vis.map.layers.each(function(l){
      //     l.updateCartoCss = function() {};
      //   });

      //   vis.set('name', 'a visualization name');
      //   expect(cartodb_layer.get('table_name')).toBe('test_table');
      //   expect(vis.get('name')).toBe('test_table');
      // });

      it("shouldn't set name if it is a visualization", function() {
        vis.map.layers.add(new cdb.admin.CartoDBLayer({ table_name: 'jam'}));

        vis.set({
          'type': 'derived'
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

      it("shouldn't set description layer name in any case", function() {
        cartodb_layer.table.set('description', 'hey description');
        vis.set({
          'type': 'table'
        },{
          silent: true
        });

        cartodb_layer.table.sync = function(a, b, opts) {
          opts.success({
            description: 'this is a description'
          }, 200);
        }

        vis.set('description', 'this is a description');
        expect(vis.map.getLayerAt(1).table.get('description')).not.toBe('this is a description');
      });

      it("shouldn't set table layer description if sync fails", function() {
        cartodb_layer.table.set('description', 'Visualization description');
        vis.set('type', 'table');

        cartodb_layer.table.sync = function(a, b, opts) {
          opts.error({}, 404);
        }

        vis.set('description', 'this is a description');
        expect(vis.map.getLayerAt(1).table.get('description')).toBe('Visualization description');
        expect(vis.get('description')).toBe('this is a description');
      });

      it("shouldn't set itself if there are at least 2 data layers", function() {
        vis.map.layers.add(new cdb.admin.CartoDBLayer({ table_name: 'test_table'}));

        vis.map.layers.each(function(l){
          if (l.table)
            l.table.set('description', 'desc example');
        });

        vis.set({
          'type': 'derived'
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

      it("shouldn't set table layer tags if there is only one data layer <==> table", function() {
        cartodb_layer.table.set('tags', ['zurullo']);
        vis.set({
          'type': 'table'
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
          'type': 'table'
        },{
          silent: true
        });

        cartodb_layer.table.sync = function(a, b, opts) {
          opts.error({}, 404);
        }

        vis.set('tags', ['esto', 'va', 'a', 'fallar']);

        expect(vis.map.getLayerAt(1).table.get('tags').length).toBe(1);
        expect(vis.map.getLayerAt(1).table.get('tags').toString()).toBe('eing');
        expect(vis.get('tags').length).toBe(4);
        expect(vis.get('tags').toString()).toBe("esto,va,a,fallar");
      });

      it("shouldn't set table layers tags if there are at least 2 data layers", function() {
        vis.map.layers.add(new cdb.admin.CartoDBLayer({ table_name: 'test_table'}));

        vis.map.layers.each(function(l){
          if (l.table)
            l.table.set('tags', ['i', 'love', 'this', 'game']);
        });

        vis.set({
          "type": "derived"
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

      // ALREADY DONE IN THE SERVER SIDE

      // it("should set table layer privacy if there is only one data layer <==> table", function() {
      //   cartodb_layer.table.set('privacy', 'PUBLIC');
      //   vis.set({
      //     'derived': false
      //   },{
      //     silent: true
      //   });

      //   cartodb_layer.table.sync = function(a, b, opts) {
      //     opts.success({
      //       privacy: 'PRIVATE'
      //     }, 200);
      //   }

      //   vis.set('privacy', 'PRIVATE');
      //   expect(cartodb_layer.table.get('privacy').toLowerCase()).toBe('private');
      // });

      it("should fetch cartodb layer if the table PRIVACY has changed", function() {
        vis.set({
          'type': 'table'
        },{
          silent: true
        });

        var called = false;

        cartodb_layer.fetch = function(a, b, opts) {
          called = true;
        }

        vis.map.layers.each(function(l){
          l.updateCartoCss = function() {};
        });

        vis.set('privacy', 'PRIVATE');
        expect(called).toBeTruthy();
      });

      // THIS IS NOT HAPPENING ANYMORE, IF FAILS 
      // SET ATTRIBUTE FUNCTION IS NOT BEING CALLED
      // AND, OF COURSE, DONE IN THE SERVER SIDE :)

      // it("shouldn't set table layer privacy if sync fails", function() {
      //   cartodb_layer.table.set('privacy', 'PUBLIC');
      //   vis.set({
      //     'derived': false
      //   },{
      //     silent: true
      //   });

      //   cartodb_layer.table.sync = function(a, b, opts) {
      //     opts.error({}, 404);
      //   }

      //   vis.set('privacy', 'PRIVATE');

      //   expect(cartodb_layer.table.get('privacy').toLowerCase()).toBe('public');
      //   expect(vis.get('privacy').toLowerCase()).toBe('public');
      // });

      it("shouldn't set table layers privacy if there are at least 2 data layers", function() {
        vis.map.layers.add(new cdb.admin.CartoDBLayer({ table_name: 'test_table'}));

        vis.map.layers.each(function(l){
          if (l.table)
            l.table.set('privacy', 'PUBLIC');
        });

        vis.set({
          'type': 'derived'
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
