
  describe("Asset manager", function() {

    var view, server;
    
    beforeEach(function() {
      cdb.config = new cdb.core.Model({ dropbox_api_key: 'j'});
      view = new cdb.admin.AssetManager({
        user: { id: 1 },
        kind: 'marker'
      })
      server = sinon.fakeServer.create();
    });

    afterEach(function() {
      view.clean();
    })

    it("should render properly 2 panes when there is no assets uploaded", function() {
      view.render();
      server.respondWith('/api/v1/users/1/assets', [200, { "Content-Type": "application/json" }, '{total_entries:0, assets: []}']);
      server.respond();
      expect(view.upload_panes.size()).toBe(2);
      expect(view.model.get('state')).toBe('idle');
      expect(view.collection.size()).toBe(0);
      expect(view.$('.ok').hasClass('disabled')).toBeTruthy();
    });

    it("should enable assets tab/pane when collection has items (assets)", function() {
      view.render();
      view.collection.reset([{ public_url: "j", kind: "marker" }]);
      expect(view.upload_panes.size()).toBe(3);
    });

    it("should render two assets item and select last item", function() {
      view.render();
      view.collection.reset([{
        public_url: 'http://com.cartodb.assets.dev.s3.amazonaws.com/development/dev/assets/layers.png',
        kind: 'pattern',
        id: 59
      },{
        public_url: 'http://com.cartodb.assets.dev.s3.amazonaws.com/development/dev/assets/layers.png',
        kind: 'marker',
        id: 58
      },{
        public_url: 'http://com.cartodb.assets.dev.s3.amazonaws.com/development/dev/assets/layers.png',
        kind: 'marker',
        id: 57
      }
      ]);
      expect(view.$('div.assets').css('display')).toBe('block');
      expect(view.$('ul.assets-list li').size()).toBe(2);
      expect(view.collection.last().get('state')).toBe("selected");
    });

    it("should active ok button when selects an asset item", function() {
      view.render();
      view.collection.reset([{
        public_url: 'http://com.cartodb.assets.dev.s3.amazonaws.com/development/dev/assets/layers.png',
        kind: 'marker',
        id: 57
      },{
        public_url: 'http://com.cartodb.assets.dev.s3.amazonaws.com/development/dev/assets/layers.png',
        kind: 'marker',
        id: 58
      }]);

      view.$('ul.assets-list li a.image').click();
      expect(view.$('.ok').hasClass('disabled')).toBeFalsy();
    });

    it("should upload the file url when user has written it", function() {
      view.render();
      spyOn(view.filePane, 'submitUpload');

      view.$('input.url-input').val('http://test.com/test.png');
      view.$('input.url-input').keyup();
      view.$('.ok').click();
      expect(view.filePane.submitUpload).toHaveBeenCalled();
    });

    it("shouldn't show sync block when user types a valid url", function() {
      view.render();

      view.$('input.url-input').val('http://test.com/test.png');
      view.$('input.url-input').keyup();

      expect(view.$('.info.no-sync').css('display')).toBe('none');
      expect(view.$('.info.sync').css('display')).toBe('none');
    });


    it("should show an error when a file upload fails", function() {
      view.render();
      spyOn(view, '_onUploadError');
      spyOn(view, '_changeState');

      view._uploadFromUrl({
        type: 'url',
        value: 'i_love_this_image.png'
      });
      
      expect(view.model.get('state')).toBe('uploading');
      expect(view.$('.upload-progress').css('opacity')).toBeGreaterThan(0);
      expect(view._changeState).toHaveBeenCalled();
      
      server.respondWith("POST", '/api/v1/users/1/assets', [400, { "Content-Type": "application/json" }, '{total_entries:0, assets: []}']);
      server.respond();
      
      expect(view._onUploadError).toHaveBeenCalled();
      expect(view.collection.size()).toBe(0);
      expect(view.$('ul.assets-list li').size()).toBe(0);
    });
  });
