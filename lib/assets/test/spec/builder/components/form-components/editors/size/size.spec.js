var Backbone = require('backbone');
var SizeByValueView = require('builder/components/form-components/editors/size/size-by-value-view');

describe('/components/form-components/editors/size/size', function () {
  var size;

  function createSize (opts) {
    opts = opts || {};
    var modelOptions = {};
    if (opts.fillSize) {
      modelOptions.fillSize = {
        fixed: opts.fillSize
      };
    }

    var options = {
      model: new Backbone.Model(modelOptions),
      key: 'fillSize',
      schema: {
        validators: [ 'required' ],
        editorAttrs: {
          geometryName: 'point',
          hidePanes: []
        }
      }
    };

    if (opts.hidePanes) {
      options.schema.editorAttrs.hidePanes = opts.hidePanes;
    }
    if (opts.columns) {
      options.schema.options = opts.columns;
    }
    return new Backbone.Form.editors.Size(options);
  }

  describe('render', function () {
    afterEach(function () {
      size.remove();
    });

    it('both fixed and value if no options passed about it', function () {
      size = createSize();

      expect(size.$('.js-menu').children().length).toBe(2);
      var labels = size.$('.js-menu > li label');
      expect(labels.length).toBe(2);
      expect(labels[0].textContent.trim()).toContain('form-components.editors.fill.input-number.fixed');
      expect(labels[1].textContent.trim()).toContain('form-components.editors.fill.input-number.by-value');
    });

    it('only fixed if hidePanes set with `value`', function () {
      size = createSize({
        hidePanes: ['value'],
        fillSize: 7
      });

      // Menu
      expect(size.$('.js-menu').children().length).toBe(1);
      var labels = size.$('.js-menu > li label');
      expect(labels.length).toBe(1);
      expect(labels[0].textContent.trim()).toContain('form-components.editors.fill.input-number.fixed');

      // Form content
      expect(size.$('.js-content form').length).toBe(1);
      expect(size.$('.js-content form .js-input').val()).toEqual('7');
    });

    describe('by value', function () {
      beforeEach(function () {
        spyOn(SizeByValueView.prototype, 'initialize');
        spyOn(SizeByValueView.prototype, 'removeDialog');
        spyOn(SizeByValueView.prototype, 'removePopupManager');
        spyOn(SizeByValueView.prototype, '_showByValueDialog');
        spyOn(SizeByValueView.prototype, 'render').and.returnValue('<div class="fake-by-value"></div>');
      });
      it('only by value if hidePanes set with `fixed`', function () {
        size = createSize({
          hidePanes: ['fixed']
        });

        // Menu
        expect(size.$('.js-menu').children().length).toBe(1);
        var labels = size.$('.js-menu > li label');
        expect(labels.length).toBe(1);
        expect(labels[0].textContent.trim()).toContain('form-components.editors.fill.input-number.by-value');

        // Form content
        expect(SizeByValueView.prototype.render).toHaveBeenCalled();

        size.remove();
      });
    });
  });
});
