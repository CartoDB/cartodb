var Backbone = require('backbone');
var TabsView = require('../../../../../../javascripts/cartodb3/components/modals/add-basemap/tabs-view');

describe('basemap-tabs-view', function () {
  beforeEach(function () {
    this.view = new TabsView({
      model: new Backbone.Model({
        tabs: new Backbone.Collection([])
      }),
      submitButton: {},
      modalFooter: {}
    });
    this.view.model.activeTabModel = function () {
      return {
        createView: function () {
          return {
            render: function () { return ''; },
            clean: function () {}
          };
        }
      };
    };
  });

  describe('.render', function () {
    it('should have the proper class name', function () {
      this.view.render();

      expect(this.view.$el.hasClass('Modal-outer')).toBe(true);
    });
  });
});
