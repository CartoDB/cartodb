var ImagePicker = require('../../../../../../javascripts/cartodb/common/dialogs/map/image_picker_view');

describe('common/dialogs/map/image_picker_view', function() {
  describe('image_picker_view (with dropbox)', function() {
    beforeEach(function() {

      cdb.config.set('dropbox_api_key', 1234);

      this.user = new cdb.admin.User({
        username: 'pepe',
        id: "1",
        base_url: 'https://cartodb.com'
      });

      this.view = new ImagePicker({
        user: this.user,
        kind: "marker"
      });
      this.view.render();
    });

    it('should render the view as expected', function() {
      expect(this.innerHTML()).toContain('Select a marker image');
      expect(this.innerHTML()).toContain('Upload your icons or just use our nice selection.');
    });

    it("should toggle the user icons tab depending on the user's assets", function() {
      expect(this.view.$('button[data-type="your_icons"]').hasClass("is-disabled")).toBe(true);

      this.view.collection.reset([{
        public_url: 'http://com.cartodb.assets.dev.s3.amazonaws.com/development/dev/assets/layers.png',
        kind: 'pattern',
        id: 59
      },{
        public_url: 'http://com.cartodb.assets.dev.s3.amazonaws.com/development/dev/assets/layers.png',
        kind: 'marker',
        id: 57
      }
      ]);

      expect(this.view.$('button[data-type="your_icons"]').hasClass("is-disabled")).toBe(false);
    });

    it("should render the right kind of assets in the user icons pane", function() {
      this.view.collection.reset([{
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
      expect(this.view.$('.AssetPane.AssetPane-userIcons .AssetsList li').size()).toBe(2);
    });

    it("should enable the submit button when the user selects an item", function() {
      this.view.collection.reset([{
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

      this.view.$('.AssetPane.AssetPane-userIcons .AssetsList li:first-child').click();
      expect(this.view.$('.js-ok').hasClass("is-disabled")).toBe(false);
      expect(this.view.model.get("submit_enabled")).toBe(true);
    });

    it("should select the asset url when clicking on an asset", function() {
      this.view.collection.reset([{
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

      this.view.$('.AssetPane.AssetPane-userIcons .AssetsList li:first-child').click();
      expect(this.view.model.get("value")).toBe("http://com.cartodb.assets.dev.s3.amazonaws.com/development/dev/assets/layers.png");
    });

    it('should have the footer button disabled by default', function() {
      expect(this.view.$('.js-ok').hasClass("is-disabled")).toBe(true);
      expect(this.view.model.get("submit_enabled")).toBe(false);
    });

    it('should active the simple icon tab', function() {
      this.view.$('button[data-type="simple_icons"]').click();
      expect(this.view.model.get("pane")).toBe('simple_icons');
      expect(this.view.$('button[data-type="your_icons"]').hasClass("is-disabled")).toBe(true);
    });

    it('should active the maki tab', function() {
      this.view.$('button[data-type="maki_icons"]').click();
      expect(this.view.model.get("pane")).toBe('maki_icons');
    });

    it('should active the pin_icons tab', function() {
      this.view.$('button[data-type="pin_icons"]').click();
      expect(this.view.model.get("pane")).toBe('pin_icons');
    });

    it('should active the footer disclaimer depending on the pane', function() {
      this.view.$('button[data-type="maki_icons"]').click();
      expect(this.innerHTML()).toContain('<a href="https://github.com/mapbox/maki" target="_blank">Maki Icons</a>, an open source project by <a href="http://mapbox.com" target="_blank">Mapbox</a>');

      this.view.$('button[data-type="pin_icons"]').click();
      expect(this.innerHTML()).toContain('<a href="http://www.flaticon.com/packs/pins-of-maps/" target="_blank">Pin Maps</a>, icons by <a href="http://freepik.com" target="_blank">freepik.com</a>');
    });

    afterEach(function() {
      this.view.clean();
    });
  });

  describe('image_picker_view (without dropbox)', function() {
    beforeEach(function() {

      cdb.config.set('dropbox_api_key', null);

      this.user = new cdb.admin.User({
        username: 'pepe',
        id: "1",
        base_url: 'https://cartodb.com'
      });

      this.view = new ImagePicker({
        user: this.user,
        kind: "marker"
      });
      this.view.render();
    });

    it("shouldn't render the dropbox pane if there's no config key", function() {
      cdb.config.set('dropbox_api_key');
      this.view.render();
      expect(this.view.$('button[data-type="dropbox"]').length).toBe(0)
    });

    afterEach(function() {
      this.view.clean();
    });
  });

});
