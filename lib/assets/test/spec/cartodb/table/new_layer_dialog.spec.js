
  describe("New layer dialog", function() {

    var view, server, vis, user;

    beforeEach(function() {
      cdb.config.set({
        dropbox_api_key: 'a',
        gdrive_app_id: 'b'
      });
      vis = TestUtil.createVis('test');
      user = TestUtil.createUser('jam');
      view = new cdb.admin.NewLayerDialog({
        vis: vis,
        tables: new cdb.admin.Visualizations(),
        user: user,
        ok: function(t){}
      });
      server = sinon.fakeServer.create();
    });

    it("should appear properly", function() {
      view.render();
      expect(view.$('.dialog-tabs .dialog-tab:eq(0) span.loader').length).toBe(1);
      expect(view.$('.dialog-tabs .dialog-tab:eq(0) span.loader').text()).toBe('Getting tables...');
      expect(view.$('p.error').length).toBe(1);
      view.tables.reset([{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"test_table","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PRIVATE","stats":{},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"jam.test_table","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}]);
      expect(view.$('.combo_wrapper').length).toBe(1);
      expect(view.$('li.option').length).toBe(3);
    });

    it("should render the dropdown properly and remove the loader", function() {
      view.render();
      expect(view.$('.dialog-tabs .dialog-tab:eq(0) span.loader').length).toBe(1);
      expect(view.$('.dialog-tabs .dialog-tab:eq(0) span.loader').text()).toBe('Getting tables...');
      expect(view.$('p.error').length).toBe(1);
      view.tables.reset([{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"test_table","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PRIVATE","stats":{},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"jam.test_table","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}]);
      expect(view.$('.dialog-pane span.loader').css('display')).toBe('none');
    });

    it("should show the error block if the tables fetch fails", function() {
      view.render();
      expect(view.$('.dialog-tabs .dialog-tab:eq(0) span.loader').length).toBe(1);
      expect(view.$('.dialog-tabs .dialog-tab:eq(0) span.loader').text()).toBe('Getting tables...');
      expect(view.$('p.error').length).toBe(1);
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false&o%5Bupdated_at%5D=desc', [400, { "Content-Type": "application/json" }, '{}']);
      server.respond();
      expect(view.$('p.error').css('display')).toBe('block');
      expect(view.$('.dialog-pane span.loader').css('display')).toBe('none');
    });

    it("should return the table chosen when clicks over ok button", function() {
      vis.set('privacy', 'public');
      view.render();
      spyOn(view, 'ok');
      view.tables.reset([{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"another_table","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PRIVATE","stats":{},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"another_table","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}]);
      server.respondWith('/api/v1/tables/85', [200, { "Content-Type": "application/json" }, '{"geometry_types":["ST_POLYGON"],"name": "another_table"}']);
      server.respond();
      view.$('a.ok').click();
      expect(view.ok).toHaveBeenCalledWith('another_table');
    });

    it("should return the table name qualified if the table doesn't belong to him", function() {
      vis.set('privacy', 'public');
      view.render();
      spyOn(view, 'ok');
      view.tables.reset([{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"test_table","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PRIVATE","stats":{},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"jam.test_table","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}]);
      server.respondWith('/api/v1/tables/85', [200, { "Content-Type": "application/json" }, '{"geometry_types":["ST_POINT"],"name": "test_table"}']);
      server.respond();
      view.$('a.ok').click();
      expect(view.ok).toHaveBeenCalledWith('jam.test_table');
    });


    it("should warn the user if table doesn't have any georeferenced data", function() {
      view.render();
      spyOn(view, 'ok');

      // Using sinon fake server and running with all test at the same time
      // fails without a good reason
      cdb.admin.CartoDBTableMetadata.prototype.fetch = function(a,b,opts){
        this.set({
          geometry_types: [],
          name: "table_name"
        });
        a.success(this)
      };
      
      view.tables.reset([{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"table_name","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PRIVATE","stats":{},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"table_name","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}]);

      expect(view.$('p.warning.geo').css('display')).toBe('block');
      view.$('a.ok').click();
      expect(view.ok).toHaveBeenCalledWith('table_name');
    });

    it("shouldn't return anything when user hasn't selected a table", function() {
      view.render();
      spyOn(view, 'ok');
      view.tables.reset([]);
      view.$('a.ok').click();
      expect(view.ok).not.toHaveBeenCalled();
    });

    it("should disable create table and import file options if user has reached his limits", function() {
      var new_user = TestUtil.createUser('jam');
      new_user.set('remaining_table_quota', 0);
      var new_view = new cdb.admin.NewLayerDialog({
        vis: vis,
        tables: new cdb.admin.Visualizations(),
        user: new_user,
        ok: function(t){}
      });

      spyOn(new_view, 'render_tooltips');
      new_view.render();
      expect(new_view.$el.find('a.radiobutton.disabled').length).toBe(2);
      expect(new_view.render_tooltips).toHaveBeenCalled();
      expect(new_view._UPLOADER.remainingQuota).toBeFalsy();
    })

    // It prevents user to create more tables opening add new layer dialog
    // because user model could be no-sync
    it("should fetch user model when a new table is created", function() {
      spyOn(user, 'fetch');
      view.render();
      view.model.set('option', 'scratch');
      // Using sinon fake server and running with all test at the same time
      // fails without a good reason
      cdb.admin.CartoDBTableMetadata.prototype.save = function(a,b){ b.success(this) };
      view.$('a.ok').click();
      expect(user.fetch).toHaveBeenCalled();
    });

    it("should not have leaks", function() {
      expect(view).toHaveNoLeaks();
    });

  })
