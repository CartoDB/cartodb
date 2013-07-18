
  describe("New layer dialog", function() {

    var view, server, vis;

    beforeEach(function() {
      vis = TestUtil.createVis('test');
      view = new cdb.admin.NewLayerDialog({
        model: vis,
        tables: new cdb.admin.Visualizations(),
        ok: function(t){}
      });
      server = sinon.fakeServer.create();
    });

    it("should appear properly", function() {
      view.render();
      expect(view.$('span.loader').length).toBe(1);
      expect(view.$('p.error').length).toBe(1);
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300', [200, { "Content-Type": "application/json" }, '{"visualizations":[{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"untitled_table_2","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PUBLIC","stats":{"2013-05-22":0,"2013-05-23":0,"2013-05-24":0,"2013-05-25":0,"2013-05-26":0,"2013-05-27":0,"2013-05-28":0,"2013-05-29":0,"2013-05-30":0,"2013-05-31":0,"2013-06-01":0,"2013-06-02":0,"2013-06-03":0,"2013-06-04":0,"2013-06-05":0,"2013-06-06":0,"2013-06-07":0,"2013-06-08":0,"2013-06-09":0,"2013-06-10":0,"2013-06-11":0,"2013-06-12":0,"2013-06-13":0,"2013-06-14":0,"2013-06-15":0,"2013-06-16":0,"2013-06-17":0,"2013-06-18":0,"2013-06-19":0,"2013-06-20":0},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"untitled_table_2","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}],"total_entries":3}']);
      server.respond();
      expect(view.$('.combo_wrapper').length).toBe(1);
    });

    it("should render the dropdown properly and remove the loader", function() {
      view.render();
      expect(view.$('span.loader').length).toBe(1);
      expect(view.$('p.error').length).toBe(1);
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300', [200, { "Content-Type": "application/json" }, '{"visualizations":[{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"untitled_table_2","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PUBLIC","stats":{"2013-05-22":0,"2013-05-23":0,"2013-05-24":0,"2013-05-25":0,"2013-05-26":0,"2013-05-27":0,"2013-05-28":0,"2013-05-29":0,"2013-05-30":0,"2013-05-31":0,"2013-06-01":0,"2013-06-02":0,"2013-06-03":0,"2013-06-04":0,"2013-06-05":0,"2013-06-06":0,"2013-06-07":0,"2013-06-08":0,"2013-06-09":0,"2013-06-10":0,"2013-06-11":0,"2013-06-12":0,"2013-06-13":0,"2013-06-14":0,"2013-06-15":0,"2013-06-16":0,"2013-06-17":0,"2013-06-18":0,"2013-06-19":0,"2013-06-20":0},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"untitled_table_2","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}],"total_entries":3}']);
      server.respond();
      expect(view.$('span.loader').css('display')).toBe('none');
    });

    it("should show the error block if the tables fetch fails", function() {
      view.render();
      expect(view.$('span.loader').length).toBe(1);
      expect(view.$('p.error').length).toBe(1);
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300', [400, { "Content-Type": "application/json" }, '{}']);
      server.respond();
      expect(view.$('p.error').css('display')).toBe('block');
      expect(view.$('span.loader').css('display')).toBe('none');
    });

    it("should return the table chosen when clicks over ok button", function() {
      view.render();
      spyOn(view, 'ok');
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false', [200, { "Content-Type": "application/json" }, '{"visualizations":[{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"table_name","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PRIVATE","stats":{"2013-05-22":0,"2013-05-23":0,"2013-05-24":0,"2013-05-25":0,"2013-05-26":0,"2013-05-27":0,"2013-05-28":0,"2013-05-29":0,"2013-05-30":0,"2013-05-31":0,"2013-06-01":0,"2013-06-02":0,"2013-06-03":0,"2013-06-04":0,"2013-06-05":0,"2013-06-06":0,"2013-06-07":0,"2013-06-08":0,"2013-06-09":0,"2013-06-10":0,"2013-06-11":0,"2013-06-12":0,"2013-06-13":0,"2013-06-14":0,"2013-06-15":0,"2013-06-16":0,"2013-06-17":0,"2013-06-18":0,"2013-06-19":0,"2013-06-20":0},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"untitled_table_2","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}],"total_entries":3}']);
      server.respond();
      view.$('a.ok').click();
      expect(view.active).toBeTruthy();
      expect(view.ok).toHaveBeenCalledWith('table_name', true);
    });

    it("should warn user that the visualization turn into private if he tries to add a private layer", function() {
      vis.set('privacy', 'PUBLIC');
      view.render();
      spyOn(view, 'ok');
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false', [200, { "Content-Type": "application/json" }, '{"visualizations":[{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"table_name","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PRIVATE","stats":{"2013-05-22":0,"2013-05-23":0,"2013-05-24":0,"2013-05-25":0,"2013-05-26":0,"2013-05-27":0,"2013-05-28":0,"2013-05-29":0,"2013-05-30":0,"2013-05-31":0,"2013-06-01":0,"2013-06-02":0,"2013-06-03":0,"2013-06-04":0,"2013-06-05":0,"2013-06-06":0,"2013-06-07":0,"2013-06-08":0,"2013-06-09":0,"2013-06-10":0,"2013-06-11":0,"2013-06-12":0,"2013-06-13":0,"2013-06-14":0,"2013-06-15":0,"2013-06-16":0,"2013-06-17":0,"2013-06-18":0,"2013-06-19":0,"2013-06-20":0},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"untitled_table_2","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}],"total_entries":3}']);
      server.respond();
      expect(view.$('p.warning.privacy').css('display')).toBe('block');
      view.$('a.ok').click();
      expect(view.active).toBeTruthy();
      expect(view.ok).toHaveBeenCalledWith('table_name', true);
    });

    it("should warn the user if table doesn't have any georeferenced data", function() {
      view.render();
      spyOn(view, 'ok');
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300&table_data=false', [200, { "Content-Type": "application/json" }, '{"visualizations":[{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"table_name","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PRIVATE","stats":{"2013-05-22":0,"2013-05-23":0,"2013-05-24":0,"2013-05-25":0,"2013-05-26":0,"2013-05-27":0,"2013-05-28":0,"2013-05-29":0,"2013-05-30":0,"2013-05-31":0,"2013-06-01":0,"2013-06-02":0,"2013-06-03":0,"2013-06-04":0,"2013-06-05":0,"2013-06-06":0,"2013-06-07":0,"2013-06-08":0,"2013-06-09":0,"2013-06-10":0,"2013-06-11":0,"2013-06-12":0,"2013-06-13":0,"2013-06-14":0,"2013-06-15":0,"2013-06-16":0,"2013-06-17":0,"2013-06-18":0,"2013-06-19":0,"2013-06-20":0},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"untitled_table_2","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}],"total_entries":3}']);
      server.respondWith('/api/v1/tables/85', [200, { "Content-Type": "application/json" }, '{"geometry_types":[],"name": "table_name"}']);
      server.respond();

      expect(view.$('p.warning.geo').css('display')).toBe('block');
      view.$('a.ok').click();
      expect(view.active).toBeTruthy();
      expect(view.ok).toHaveBeenCalledWith('table_name', true);
    });

    it("shouldn't return anything when user hasn't selected a table", function() {
      view.render();
      spyOn(view, 'ok');
      server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&per_page=300', [400, { "Content-Type": "application/json" }, '{}']);
      server.respond();
      view.$('a.ok').click();
      expect(view.active).toBeFalsy();
      expect(view.ok).not.toHaveBeenCalled();
    });

  })
