
  describe("Visualizations selector", function() {

    var view, server, tables, user;

    beforeEach(function() {
      tables = new cdb.admin.Visualizations({ type: 'table' });
      user = TestUtil.createUser('jam');
      view = new cdb.ui.common.VisualizationsSelector({
        model: tables,
        user: user
      });
      server = sinon.fakeServer.create();
    });

    it("should appear properly", function() {
      view.render();
      expect(view.$('select').length).toBe(1);
      expect(view.$('.select2-container').length).toBe(1);
    });

    it("should re-render when visualizations is fetched", function() {
      view.render();
      expect(_.size(view._subviews)).toBe(1);
      var first_view = _.first(view._subviews);
      tables.reset([]);
      expect(_.size(view._subviews)).toBe(1);
      expect(first_view).toBe(undefined);
    });

    it('should trigger change event when combo is initialized', function() {
      var called = false;
      view.bind('change', function() {
        called = true;
      })
      view.render();
      expect(called).toBeTruthy();
    });

    it('should return table selected info', function() {
      view.render();
      expect(view.getSelected()).toBe(null);
      tables.reset([{"id":"f4072f74-d736-11e2-8b6c-94942608096a","name":"test_table","map_id":178,"active_layer_id":511,"type":"table","tags":[],"description":"description","privacy":"PRIVATE","stats":{},"created_at":"2013-06-17T10:16:19+02:00","updated_at":"2013-06-19T12:23:58+02:00","table":{"id":85,"name":"test_table","privacy":"PUBLIC","size":24576,"row_count":0,"updated_at":"2013-06-17T12:16:19+02:00"}}]);
      expect(view.getSelected().vis_id).toBe('f4072f74-d736-11e2-8b6c-94942608096a');
      expect(view.getSelected().name).toBe('test_table');
    });

    it("should not have leaks", function() {
      expect(view).toHaveNoLeaks();
    });

  })
