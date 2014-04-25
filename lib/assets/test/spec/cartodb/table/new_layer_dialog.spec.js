
  describe("New layer dialog", function() {

    var view, server, vis;

    beforeEach(function() {
      cdb.config = new cdb.core.Model({
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
      expect(view.$('span.loader').length).toBe(1);
      expect(view.$('p.error').length).toBe(1);
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false&o%5Bupdated_at%5D=desc', [200, { "Content-Type": "application/json" }, '{"visualizations":[{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"untitled_table_2","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PUBLIC","stats":{"2013-05-22":0,"2013-05-23":0,"2013-05-24":0,"2013-05-25":0,"2013-05-26":0,"2013-05-27":0,"2013-05-28":0,"2013-05-29":0,"2013-05-30":0,"2013-05-31":0,"2013-06-01":0,"2013-06-02":0,"2013-06-03":0,"2013-06-04":0,"2013-06-05":0,"2013-06-06":0,"2013-06-07":0,"2013-06-08":0,"2013-06-09":0,"2013-06-10":0,"2013-06-11":0,"2013-06-12":0,"2013-06-13":0,"2013-06-14":0,"2013-06-15":0,"2013-06-16":0,"2013-06-17":0,"2013-06-18":0,"2013-06-19":0,"2013-06-20":0},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"untitled_table_2","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}],"total_entries":3}']);
      server.respond();
      expect(view.$('.combo_wrapper').length).toBe(1);
      expect(view.$('li.option').length).toBe(3);
    });

    it("should render the dropdown properly and remove the loader", function() {
      view.render();
      expect(view.$('span.loader').length).toBe(1);
      expect(view.$('p.error').length).toBe(1);
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false&o%5Bupdated_at%5D=desc', [200, { "Content-Type": "application/json" }, '{"visualizations":[{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"untitled_table_2","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PUBLIC","stats":{"2013-05-22":0,"2013-05-23":0,"2013-05-24":0,"2013-05-25":0,"2013-05-26":0,"2013-05-27":0,"2013-05-28":0,"2013-05-29":0,"2013-05-30":0,"2013-05-31":0,"2013-06-01":0,"2013-06-02":0,"2013-06-03":0,"2013-06-04":0,"2013-06-05":0,"2013-06-06":0,"2013-06-07":0,"2013-06-08":0,"2013-06-09":0,"2013-06-10":0,"2013-06-11":0,"2013-06-12":0,"2013-06-13":0,"2013-06-14":0,"2013-06-15":0,"2013-06-16":0,"2013-06-17":0,"2013-06-18":0,"2013-06-19":0,"2013-06-20":0},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"untitled_table_2","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}],"total_entries":3}']);
      server.respond();
      expect(view.$('span.loader').css('display')).toBe('none');
    });

    it("should show the error block if the tables fetch fails", function() {
      view.render();
      expect(view.$('span.loader').length).toBe(1);
      expect(view.$('p.error').length).toBe(1);
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false&o%5Bupdated_at%5D=desc', [400, { "Content-Type": "application/json" }, '{}']);
      server.respond();
      expect(view.$('p.error').css('display')).toBe('block');
      expect(view.$('span.loader').css('display')).toBe('none');
    });

    xit("should return the table chosen when clicks over ok button", function() {
      vis.set('privacy', 'public');
      view.render();
      // spyOn(view, 'ok');
      server.respondWith("/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false&o%5Bupdated_at%5D=desc", [200, { "Content-Type": "application/json" }, '{"visualizations":[{"id":"ac5530fc-033e-11e3-b710-94942608096a","name":"points_table","map_id":358,"active_layer_id":1017,"type":"table","tags":[],"description":null,"privacy":"PUBLIC","table":{"id":193,"name":"points_table"},"synchronization":null,"stats":{},"created_at":"2013-08-12T11:02:26+02:00","updated_at":"2013-10-10T13:20:58+02:00"}],"total_entries":1}']);
      // /api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false
      server.respond();
      // view.$('a.ok').click();
      // expect(view.table_selection.get('private')).toBeTruthy();
      // expect(view.ok).toHaveBeenCalledWith('table_name', true);
    });

    xit("should warn user that the visualization turn into private if he tries to add a private layer", function() {
      vis.set('privacy', 'PUBLIC');
      view.render();
      spyOn(view, 'ok');
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false&o%5Bupdated_at%5D=desc', [200, { "Content-Type": "application/json" }, '{"visualizations":[{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"table_name","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PRIVATE","stats":{"2013-05-22":0,"2013-05-23":0,"2013-05-24":0,"2013-05-25":0,"2013-05-26":0,"2013-05-27":0,"2013-05-28":0,"2013-05-29":0,"2013-05-30":0,"2013-05-31":0,"2013-06-01":0,"2013-06-02":0,"2013-06-03":0,"2013-06-04":0,"2013-06-05":0,"2013-06-06":0,"2013-06-07":0,"2013-06-08":0,"2013-06-09":0,"2013-06-10":0,"2013-06-11":0,"2013-06-12":0,"2013-06-13":0,"2013-06-14":0,"2013-06-15":0,"2013-06-16":0,"2013-06-17":0,"2013-06-18":0,"2013-06-19":0,"2013-06-20":0},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"untitled_table_2","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}],"total_entries":3}']);
      server.respond();
      view.table_selection.set('table', 'table_name');
      expect(view.$('p.warning.privacy').css('display')).toBe('block');
      view.$('a.ok').click();
      expect(view.ok).toHaveBeenCalledWith('table_name', true);
    });

    it("should warn the user if table doesn't have any georeferenced data", function() {
      view.render();
      spyOn(view, 'ok');
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false&o%5Bupdated_at%5D=desc', [200, { "Content-Type": "application/json" }, '{"visualizations":[{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"table_name","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PRIVATE","stats":{"2013-05-22":0,"2013-05-23":0,"2013-05-24":0,"2013-05-25":0,"2013-05-26":0,"2013-05-27":0,"2013-05-28":0,"2013-05-29":0,"2013-05-30":0,"2013-05-31":0,"2013-06-01":0,"2013-06-02":0,"2013-06-03":0,"2013-06-04":0,"2013-06-05":0,"2013-06-06":0,"2013-06-07":0,"2013-06-08":0,"2013-06-09":0,"2013-06-10":0,"2013-06-11":0,"2013-06-12":0,"2013-06-13":0,"2013-06-14":0,"2013-06-15":0,"2013-06-16":0,"2013-06-17":0,"2013-06-18":0,"2013-06-19":0,"2013-06-20":0},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"untitled_table_2","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}],"total_entries":3}']);
      server.respondWith('/api/v1/tables/85', [200, { "Content-Type": "application/json" }, '{"geometry_types":[],"name": "table_name"}']);
      server.respond();

      expect(view.$('p.warning.geo').css('display')).toBe('block');
      view.$('a.ok').click();
      expect(view.ok).toHaveBeenCalledWith('table_name');
    });

    it("shouldn't return anything when user hasn't selected a table", function() {
      view.render();
      spyOn(view, 'ok');
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false&o%5Bupdated_at%5D=desc', [400, { "Content-Type": "application/json" }, '{}']);
      server.respond();
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
      view.$('a.ok').click();
      server.respondWith('/api/v1/tables/', [200, { "Content-Type": "application/json" }, '{}']);
      server.respond();
      expect(user.fetch).toHaveBeenCalled();
    });

  })
