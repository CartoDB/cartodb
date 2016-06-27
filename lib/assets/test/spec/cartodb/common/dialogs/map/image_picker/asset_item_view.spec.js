var Backbone = require('backbone-cdb-v3');
var AssetsItemView = require('../../../../../../../javascripts/cartodb/common/dialogs/map/image_picker/assets_item_view');

describe('common/dialogs/map/image_picker/assets_item_view', function() {
  describe('.render', function() {
    describe('given an model of kind marker and with an image that is smaller than the defined min size', function() {
      var view;

      var $image = function() {
        return view.$('a.image');
      };

      beforeEach(function(done) {
        var model = new Backbone.Model({
          kind: 'marker',
          public_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaAQMAAACThN6NAAAAA3NCSVQICAjb4U/gAAAABlBM' +
                      'VEX///8AAABVwtN+AAAAAnRSTlP/AOW3MEoAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAMSURBVAiZY2AYaAAAAIIAAQrotp' +
                      'MAAAAASUVORK5CYII=' //26x26 px
        });

        view = new AssetsItemView({
          model: model
        });

        view.render();

        var waitForImgLoad;
        (waitForImgLoad = function() {
          if ($image().css('background-size') !== '') {
            done();
          } else {
            setTimeout(waitForImgLoad, 50);
          }
        })();
      });

      it('should render the image with a background-size overriden to the minimum size', function(done) {
        // Using toMatch instead of toEqual because depending on env the CSS-value may contain irrelevant spaces
        expect($image().css('background-size')).toMatch('32px');
        done();
      });

      afterEach(function() {
        view.clean();
      });
    });
  });
});
