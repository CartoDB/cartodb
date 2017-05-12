var _ = require('underscore');

module.exports = function (editorType, options) {
  var _class = Backbone.Form.editors[editorType];
  options = options || {};

  describe('trackingClass', function () {
    it('should not add the class if it not is specified', function () {
      var view = new _class(options);
      expect(view.$el.hasClass('track-class-whatever')).toBeFalsy();
      expect(view.options.trackingClass).toBeUndefined();
    });

    it('should add the class if it is specified', function () {
      var view = new _class(
        _.extend(options, {
          trackingClass: 'track-class-whatever'
        })
      );

      expect(view.$el.hasClass('track-class-whatever')).toBeTruthy();
    });
  });
};
