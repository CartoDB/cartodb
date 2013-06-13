
  describe("New layer dialog", function() {

    var view, server;

    beforeEach(function() {
      view = new cdb.admin.NewLayerDialog({
        ok: function(t){}
      });
      server = sinon.fakeServer.create();
    });

    it("should appear properly", function() {
      view.render();
      expect(view.$('span.loader').length).toBe(1);
      expect(view.$('p.error').length).toBe(1);
      server.respondWith('/api/v1/tables/?tag_name=&q=&page=1&type=table&per_page=300', [200, { "Content-Type": "application/json" }, '{"tables":[{"id":29,"name":"table_name","privacy":"PRIVATE","updated_at":"2013-05-23T15:59:12+02:00","rows_counted":0,"table_size":24576,"map_id":59,"description":null,"table_visualization":null,"affected_visualizations":[]}],"total_entries":1}']);
      server.respond();
      expect(view.$('.combo_wrapper').length).toBe(1);
    });

    it("should render the dropdown properly and remove the loader", function() {
      view.render();
      expect(view.$('span.loader').length).toBe(1);
      expect(view.$('p.error').length).toBe(1);
      server.respondWith('/api/v1/tables/?tag_name=&q=&page=1&type=table&per_page=300', [200, { "Content-Type": "application/json" }, '{"tables":[{"id":29,"name":"table_name","privacy":"PRIVATE","updated_at":"2013-05-23T15:59:12+02:00","rows_counted":0,"table_size":24576,"map_id":59,"description":null,"table_visualization":null,"affected_visualizations":[]}],"total_entries":1}']);
      server.respond();
      expect(view.$('span.loader').css('display')).toBe('none');
      console.log(view.$el.html())
    });

    it("should show the error block if the tables fetch fails", function() {
      view.render();
      expect(view.$('span.loader').length).toBe(1);
      expect(view.$('p.error').length).toBe(1);
      server.respondWith('/api/v1/tables/?tag_name=&q=&page=1&type=table&per_page=300', [400, { "Content-Type": "application/json" }, '{"tables":[{"id":29,"name":"table_name","privacy":"PRIVATE","updated_at":"2013-05-23T15:59:12+02:00","rows_counted":0,"table_size":24576,"map_id":59,"description":null,"table_visualization":null,"affected_visualizations":[]}],"total_entries":1}']);
      server.respond();
      expect(view.$('p.error').css('display')).toBe('block');
      expect(view.$('span.loader').css('display')).toBe('none');
    });

    it("should return the table chosen when clicks over ok button", function() {
      view.render();
      spyOn(view, 'ok');
      server.respondWith('/api/v1/tables/?tag_name=&q=&page=1&type=table&per_page=300', [200, { "Content-Type": "application/json" }, '{"tables":[{"id":29,"name":"table_name","privacy":"PRIVATE","updated_at":"2013-05-23T15:59:12+02:00","rows_counted":0,"table_size":24576,"map_id":59,"description":null,"table_visualization":null,"affected_visualizations":[]}],"total_entries":1}']);
      server.respond();
      view.$('a.ok').click();
      expect(view.active).toBeTruthy();
      expect(view.ok).toHaveBeenCalledWith('table_name');
    });

    it("shouldn't return anything when user hasn't selected a table", function() {
      view.render();
      spyOn(view, 'ok');
      server.respondWith('/api/v1/tables/?tag_name=&q=&page=1&type=table&per_page=300', [400, { "Content-Type": "application/json" }, '{"tables":[{"id":29,"name":"table_name","privacy":"PRIVATE","updated_at":"2013-05-23T15:59:12+02:00","rows_counted":0,"table_size":24576,"map_id":59,"description":null,"table_visualization":null,"affected_visualizations":[]}],"total_entries":1}']);
      server.respond();
      view.$('a.ok').click();
      expect(view.active).toBeFalsy();
      expect(view.ok).not.toHaveBeenCalled();
    });

  })