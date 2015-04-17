var cdb = require('cartodb.js');
var DialogFactory = require('../../../../javascripts/cartodb/new_common/dialog_factory');

describe('new_common/dialog_factory', function() {
  describe('.byTemplate', function() {
    it('should return a new dialog', function() {
      var template = cdb.templates.getTemplate('new_common/templates/loading');
      var dialog = DialogFactory.byTemplate(template);

      expect(dialog).toEqual(jasmine.any(Object));
      expect(dialog.render_content).toEqual(jasmine.any(Function));
      expect(dialog.appendToBody).toEqual(jasmine.any(Function));
      expect(dialog.appendToBody).toEqual(jasmine.any(Function));
    });

    describe('when given a templateData param', function() {
      beforeEach(function() {
        this.template = cdb.templates.getTemplate('new_common/templates/fail');
      });

      it('should allow to provide custom template data', function() {
        var dialog = DialogFactory.byTemplate(this.template, {
          templateData: {
            msg: 'a failing msg'
          }
        });
        dialog.render();

        expect(this.innerHTML(dialog)).toContain('Oouch!');
        expect(this.innerHTML(dialog)).toContain('a failing msg');
      });
    });
  });
});
