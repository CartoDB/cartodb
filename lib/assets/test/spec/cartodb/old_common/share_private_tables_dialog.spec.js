
  describe("Share private tables dialog", function() {
    var view, vis;
    beforeEach(function() {
      vis = new cdb.admin.Visualization({
        map_id:           96,
        active_layer_id:  null,
        name:             "test_table",
        description:      "Visualization description",
        tags:             ["jamon","probando","test"],
        privacy:          "PRIVATE",
        updated_at:       "2013-03-04T18:09:34+01:00",
        type:             "derived",
        related_tables:   [{ id: "hello", "table_name": "hello", "privacy": "PRIVATE" }]
      });

      view = new cdb.admin.SharePrivateTablesDialog({
        model: vis,
        ok_next: "Next"
      });
    });

    afterEach(function() {
      view.clean();
    })

    it("should render properly from the beginning", function() {
      view.render();
      expect(view.$('li').length == 1).toBeTruthy();
      expect(view.$('li a.button').length == 1).toBeTruthy();
      expect(view.$('li a.name').length == 1).toBeTruthy();
      expect(view.$('li span.loader').length == 1).toBeTruthy();
      expect(view.$('li span.status').length == 1).toBeTruthy();
      expect(view.$('p.error').hasClass('hide')).toBeTruthy();
    });

    it("shouldn't render public tables related to the visualization, only private", function() {
       var new_vis = new cdb.admin.Visualization({
        map_id:           96,
        active_layer_id:  null,
        name:             "test_table",
        description:      "Visualization description",
        tags:             ["jamon","probando","test"],
        privacy:          "PRIVATE",
        updated_at:       "2013-03-04T18:09:34+01:00",
        type:             "derived",
        related_tables:   [{ id: "hello", "table_name": "hello", "privacy": "PRIVATE" }, { id: "hello2", "table_name": "hello2", "privacy": "PUBLIC" }]
      });

      var new_view = new cdb.admin.SharePrivateTablesDialog({
        model: new_vis,
        ok_next: "Next"
      });


      new_view.render();
      expect(new_view.$('li').length == 1).toBeTruthy();
      expect(new_view.$('li a.button').length == 1).toBeTruthy();
      expect(new_view.$('li a.name').length == 1).toBeTruthy();
      expect(new_view.$('li span.loader').length == 1).toBeTruthy();
      expect(new_view.$('li span.status').length == 1).toBeTruthy();
      expect(new_view.$('p.error').hasClass('hide')).toBeTruthy();

      new_view.clean();
    });

    it("should make public a private table and change the state of the dialog", function() {
      view.render();

      var server = sinon.fakeServer.create();

      view.$('li > a.button').click();

      server.respondWith('/api/v1/tables/hello', [200, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      expect(vis.related_tables.at(0).get('privacy').toLowerCase()).toBe('public');
      expect(view.$('a.ok').text() == view.options.ok_next).toBeTruthy();
    });

    it("shouldn't make public a private table or change the state of the dialog", function() {
      view.render();

      var server = sinon.fakeServer.create();

      view.$('li > a.button').click();

      server.respondWith('/api/v1/tables/hello', [404, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      expect(view.$('p.error').css('display')).toBe('block');
      expect(vis.related_tables.at(0).get('privacy').toLowerCase()).toBe('private');
    });
    
    it("should start another function when user has changed all his private tables", function() {
      var called = false;
      view.ok = function() {
        called = true;
      };

      view.render();
      var server = sinon.fakeServer.create();

      view.$('li > a.button').click();

      server.respondWith('/api/v1/tables/hello', [200, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      view.$('a.ok').click();
      expect(called).toBeTruthy();
    });

    it("should change only a table privacy if the process worked", function() {
      var new_vis = new cdb.admin.Visualization({
        map_id:           96,
        active_layer_id:  null,
        name:             "test_table",
        description:      "Visualization description",
        tags:             ["jamon","probando","test"],
        privacy:          "PRIVATE",
        updated_at:       "2013-03-04T18:09:34+01:00",
        type:             "derived",
        related_tables:   [
          {
            name: 'hello',
            privacy: 'private',
            id: 'hello'
          },
          {
            name: 'hello2',
            privacy: 'private',
            id: 'hello2'
          }
        ]
      });

      var new_view = new cdb.admin.SharePrivateTablesDialog({
        model: new_vis,
        ok_next: "Next"
      });

      new_view.render();

      expect(new_view.$('li').length == 2).toBeTruthy();

      var server = sinon.fakeServer.create();

      new_view.$('ul li:eq(0) > a.button').click();

      server.respondWith('/api/v1/tables/hello', [200, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      expect(new_vis.related_tables.at(0).get('privacy').toLowerCase()).toBe('public');
      expect(new_vis.related_tables.at(1).get('privacy').toLowerCase()).toBe('private');
      expect(new_view.$('a.ok').text() != new_view.options.ok_next).toBeTruthy();

      new_view.clean();
    });
  });
