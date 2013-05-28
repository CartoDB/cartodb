
  describe("Share privacy dialog", function() {
    var view, vis;
    beforeEach(function() {
      vis = TestUtil.createVis('test');
      vis.set('related_tables', [{
        name: 'hello',
        privacy: 'private',
        id: 5
      }]);
      view = new cdb.admin.SharePrivacyDialog({
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

    it("should make public a private table and change the state of the dialog", function() {
      view.render();
      spyOn(view, '_setLoading');
      spyOn(view, '_hideError');
      spyOn(view, '_showLoader');

      var server = sinon.fakeServer.create();

      view.$('li > a.button').click();
      
      expect(view._setLoading).toHaveBeenCalled();
      expect(view._hideError).toHaveBeenCalled();
      expect(view._showLoader).toHaveBeenCalled();

      server.respondWith('/api/v1/tables/5', [200, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      expect(vis.get('related_tables')[0].privacy.toLowerCase()).toBe('public');
      expect(view.$('a.ok').text() == view.options.ok_next).toBeTruthy();
    });

    it("shouldn't make public a private table or change the state of the dialog", function() {
      view.render();
      spyOn(view, '_showError');
      spyOn(view, '_hideLoader');

      var server = sinon.fakeServer.create();

      view.$('li > a.button').click();

      server.respondWith('/api/v1/tables/5', [404, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      expect(view._showError).toHaveBeenCalled();
      expect(view._hideLoader).toHaveBeenCalled();
      expect(vis.get('related_tables')[0].privacy.toLowerCase()).toBe('private');
    });
    
    it("should start another function when user has changed all his private tables", function() {
      var done = false;
      view.ok = function() {
        done = true;
      };

      view.render();
      var server = sinon.fakeServer.create();

      view.$('li > a.button').click();

      server.respondWith('/api/v1/tables/5', [200, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      view.$('a.ok').click();
      expect(done).toBeTruthy();
    });

    it("should change only a table privacy if the process worked", function() {
      vis.set('related_tables', [
        {
          name: 'hello',
          privacy: 'private',
          id: 5
        },
        {
          name: 'hello2',
          privacy: 'private',
          id: 10
        }
      ])

      view.render();

      expect(view.$('li').length == 2).toBeTruthy();

      var server = sinon.fakeServer.create();

      view.$('ul li:eq(0) > a.button').click();

      server.respondWith('/api/v1/tables/5', [200, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      expect(vis.get('related_tables')[0].privacy.toLowerCase()).toBe('public');
      expect(vis.get('related_tables')[1].privacy.toLowerCase()).toBe('private');
      expect(view.$('a.ok').text() != view.options.ok_next).toBeTruthy();
    });
  });
