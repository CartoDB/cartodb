var Backbone = require('backbone');
var View = require('builder/components/form-components/editors/size/size-by-value-content-view');

describe('components/form-components/editors/size/size-by-value-content-view', function () {
  var view;

  function createView (model, opts) {
    model = model || new Backbone.Model({
      bins: 7,
      attribute: 'price',
      quantification: 'jenks'
    });

    opts = opts || {};
    if (opts.fixed) {
      model.set('fixed', opts.fixed);
    }
    if (opts.range) {
      model.set('range', opts.range);
    }

    var options = {
      model: model,
      min: 1,
      max: 50
    };

    return new View(options);
  }

  describe('render', function () {
    it('should render template and call _initForm', function () {
      view = createView();
      spyOn(view, '_initForm');

      view.render();

      expect(view.$('.js-back').length).toBe(1);
      expect(view.$('.test-quantification')[0].textContent.trim()).toContain('jenks');
      expect(view.$('.test-bins')[0].textContent.trim().indexOf('7')).toBe(0);
      expect(view.$('.test-attribute')[0].textContent.trim()).toEqual('price');
      expect(view._initForm).toHaveBeenCalled();
    });
  });

  describe('_initForm', function () {
    it('should calculate range and create formView', function () {
      view = createView();
      spyOn(view, '_getRangeOrCalculateItIfNeeded').and.returnValue(808);
      spyOn(view, '_createFormView').and.returnValue('a_formview');
      spyOn(view, '_renderFormView');

      view._initForm();

      expect(view._getRangeOrCalculateItIfNeeded).toHaveBeenCalled();
      expect(view._createFormView).toHaveBeenCalledWith(808);
      expect(view._renderFormView).toHaveBeenCalled();
    });
  });

  describe('_getRangeOrCalculateItIfNeeded', function () {
    it('should calculate range from fixed', function () {
      view = createView(null, { fixed: 18 });

      var range = view._getRangeOrCalculateItIfNeeded();

      expect(range[0]).toBe(6);
      expect(range[1]).toBe(29);
      expect(view.model.get('fixed')).not.toBeDefined();
      expect(view.model.get('range')).toBeDefined();
      expect(view.model.get('range')[0]).toBe(6);
      expect(view.model.get('range')[1]).toBe(29);
    });

    it('should return range if exists', function () {
      view = createView(null, { range: [45, 57] });

      var range = view._getRangeOrCalculateItIfNeeded();

      expect(range[0]).toBe(45);
      expect(range[1]).toBe(57);
    });
  });

  describe('_createFormView', function () {
    it('should create the form view', function () {
      view = createView();

      var formView = view._createFormView([45, 47]);

      expect(formView.model.get('min')).toBe(45);
      expect(formView.model.get('max')).toBe(47);
      expect(formView.model.schema).toEqual(jasmine.objectContaining({
        min: {
          type: 'Number',
          validators: [
            'required',
            {
              type: 'interval',
              min: 1,
              max: 50
            }
          ]
        },
        max: {
          type: 'Number',
          validators: [
            'required',
            {
              type: 'interval',
              min: 1,
              max: 50
            }
          ]
        }
      }));
    });

    it('change bindings sets model and commits form', function () {
      view = createView(null, { range: [15, 35] });
      view.render();

      var $input1 = view.$('.js-input').first();
      var $input2 = view.$('.js-input').last();
      $input1.val(10);
      $input2.val(40);
      view._formView.trigger('change');

      expect(view.model.get('range')[0]).toEqual(10);
      expect(view.model.get('range')[1]).toEqual(40);
    });
  });

  describe('events', function () {
    it('should hook up js-back with _onClickBack', function (done) {
      view = createView(null, { range: [15, 35] });
      view.render();
      view.on('back', function () {
        expect(true).toBe(true);
        done();
      });

      view.$('.js-back').click();
    });

    it('should hook up js-quantification with _onClickQuantification', function (done) {
      view = createView(null, { range: [15, 35] });
      view.render();
      view.on('selectQuantification', function () {
        expect(true).toBe(true);
        done();
      });

      view.$('.js-quantification').click();
    });

    it('should hook up js-bins with _onClickBins', function (done) {
      view = createView(null, { range: [15, 35] });
      view.render();
      view.on('selectBins', function () {
        expect(true).toBe(true);
        done();
      });

      view.$('.js-bins').click();
    });
  });

  describe('clean', function () {
    it('clean removes form', function () {
      view = createView();
      view.render();
      expect(view.$('form').length).toBe(1);

      view.clean();

      expect(view.$('form').length).toBe(0);
    });
  });
});
