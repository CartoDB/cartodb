
  describe("Share controller", function() {

    var vis, controller, config, user;

    beforeEach(function() {

      user_data = {
        username: "dev",
        actions: {
          private_maps: false
        }
      };

      vis = TestUtil.createVis("jam");
      vis.set('related_tables', [{
        name: 'hello',
        privacy: 'private',
        id: 5
      }]);

      var cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table' });

      vis.map.layers.reset([
        new cdb.geo.MapLayer(),
        cartodb_layer
      ]);

      config = {};
      user = TestUtil.createUser('jamon');
    });

    afterEach(function() {
      controller.clean();
    });

    it("should only add one step into the stack and show create visualization", function() {
      vis.set('type', 'table', { silent:true });

      controller = new cdb.admin.ShareController({
        model: vis,
        config: config,
        user: user
      });

      expect(controller.stack.length).toBe(0);
      expect(_.size(controller._subviews)).toBe(1);
    });

    it("should add one step into the stack and appear 'share dialog'", function() {
      vis.set('type', 'derived', { silent:true });
      vis.set('id', '5', { silent:true });
      vis.set('privacy', 'PRIVATE', { silent:true });
      vis.set('related_tables', [{
        name: 'hello',
        privacy: 'PUBLIC',
        id: 5
      }], { silent:true });

      controller = new cdb.admin.ShareController({
        model: vis,
        config: config,
        user: user
      });

      expect(controller.stack.length).toBe(0);
      expect(_.size(controller._subviews)).toBe(1);

      for (var i in controller._subviews) {
        var dlg = controller._subviews[i];
        break;
      }

      var server = sinon.fakeServer.create();

      dlg.$('a.ok').click();

      server.respondWith('/api/v1/viz/5', [200, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      dlg.$('a.ok').click();

      expect(_.size(controller._subviews)).toBe(1);
      for (var i in controller._subviews) {
        var dlg = controller._subviews[i];
      }
      expect(dlg.mapOptions).toBeDefined();
      expect(dlg.$('h3:eq(0)').text()).toBe('Share settings');
    });

    it("should only open the 'share dialog'", function() {
      vis.set('type', 'derived', { silent:true });
      vis.set('privacy', 'PUBLIC', { silent:true });

      controller = new cdb.admin.ShareController({
        model: vis,
        config: config,
        user: user
      });

      expect(controller.stack.length).toBe(0);
      expect(_.size(controller._subviews)).toBe(1);

      for (var i in controller._subviews) {
        var dlg = controller._subviews[i];
      }
      expect(dlg.mapOptions).toBeDefined();
      expect(dlg.$('h3:eq(0)').text()).toBe('Share settings');
    });

    it("should turn vis to public and show share dialog", function() {
      vis.set('type', 'derived', { silent:true });
      vis.set('id', '5', { silent:true });
      vis.set('privacy', 'PRIVATE', { silent:true });

      controller = new cdb.admin.ShareController({
        model: vis,
        config: config,
        user: user
      });

      var server = sinon.fakeServer.create();

      expect(_.size(controller._subviews)).toBe(1);
      expect(controller.stack.length).toBe(0);
      for (var i in controller._subviews) {
        var dlg = controller._subviews[i];
      }
      dlg.$('a.make_public').click();

      server.respondWith('/api/v1/tables/5', [200, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      dlg.$('a.ok').click();

      server.respondWith('/api/v1/viz/5', [200, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      expect(_.size(controller._subviews)).toBe(1);

      for (var i in controller._subviews) {
        var dlg = controller._subviews[i];
      }

      expect(dlg.mapOptions).toBeDefined();
      expect(dlg.$('h3:eq(0)').text()).toBe('Share settings');

    });
  })
