
  describe("Share private vis dialog", function() {
    var view, vis;
    beforeEach(function() {
      vis = TestUtil.createVis('test');
      vis.set('id', 5, { silent:true })
      
      view = new cdb.admin.SharePrivateVisDialog({
        model: vis,
        next_button: 'Share it'
      });
    });

    afterEach(function() {
      view.clean();
    })

    it("should render properly from the beginning", function() {
      view.render();
      expect(view.$('span.loader').length == 1).toBeTruthy();
      expect(view.$('p.error').length == 1).toBeTruthy();
    });

    it("should make public the visualization and change the state of the dialog", function() {
      view.render();
      spyOn(view, '_hideError');
      spyOn(view, '_showLoader');
      spyOn(view, '_disableButton');
      spyOn(view, '_setReady');

      var server = sinon.fakeServer.create();

      view.$('a.ok').click();
      
      expect(view._hideError).toHaveBeenCalled();
      expect(view._showLoader).toHaveBeenCalled();
      expect(view._disableButton).toHaveBeenCalled();

      server.respondWith('/api/v1/viz/5', [200, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      expect(view._setReady).toHaveBeenCalled();
    });

    it("shouldn't make public a private table or change the state of the dialog", function() {
      view.render();
      spyOn(view, '_showError');
      spyOn(view, '_hideLoader');

      var server = sinon.fakeServer.create();

      view.$('a.ok').click();

      server.respondWith('/api/v1/viz/5', [400, { "Content-Type": "application/json" }, '{}']);
      server.respond();

      expect(view._showError).toHaveBeenCalled();
      expect(view._hideLoader).toHaveBeenCalled();
      expect(view.$('a.ok').text() == view.options.next_button).toBeFalsy();
      expect(view.active).toBeFalsy();
      expect(view.loading).toBeFalsy();
      expect(view.$('a.ok').hasClass('disabled')).toBeFalsy();
    });

  });
