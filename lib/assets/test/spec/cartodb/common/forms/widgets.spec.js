
describe('Form', function() {
  var view;
  beforeEach(function() {
    var simple_form = [
      {
         name: 'Marker Fill',
         form: {
           'polygon-fill': {
                 type: 'color' ,
                 value: '#00FF00'
            },
            'polygon-opacity': {
                 type: 'opacity' ,
                 value: 0.6
            }
        }
      },
      {
         name: 'test',
         form: {
           'polygon-fill': {
                 type: 'color' ,
                 value: '#00FF00'
            },
            'polygon-opacity': {
                 type: 'opacity' ,
                 value: 0.6
            }
        }
      }
    ]; 
    view = new cdb.forms.Form({
      form_data: simple_form,
      model: new Backbone.Model()
    });


  });

  it('should render form fields', function() {
    view.render();
    expect(view.$('li').length).toEqual(2);
    expect(view.$('.form_color').length).toEqual(2);
    expect(view.$('.form_spinner').length).toEqual(2);
    expect(_.keys(view._subviews).length).toEqual(4);
  });

  it('should has a model with properties', function() {
    view.render();
    expect(view.model.get('polygon-fill')).toEqual('#00FF00');
    expect(view.model.get('polygon-opacity')).toEqual(0.6);
  });

});

describe('widgets', function() {

  describe('cdb.forms.Color', function() {
    var view, model;
    beforeEach(function() {
      model = new Backbone.Model({ 'test': '#FFF'});
      view = new cdb.forms.Color({ model: model, property: 'test' });
    });

    it("should render", function() {
      view.render();
      expect(view.$('.color').css('background-color')).toEqual('rgb(255, 255, 255)');
    });

    it("should render color", function() {
      model.set({ test: '#000' });
      expect(view.$('.color').css('background-color')).toEqual('rgb(0, 0, 0)');
    });
  });

  describe('cdb.forms.Spinner', function() {
    var view, model;
    beforeEach(function() {
      model = new Backbone.Model({ 'test': 0});
      view = new cdb.forms.Spinner({ el: $('<div>'), model: model, property: 'test' });
    });

    it("should render", function() {
      view.render();
      expect(view.$('.value').html()).toEqual('0');
    });

    it("should render color", function() {
      model.set({ test: 1 });
      expect(view.$('.value').html()).toEqual('1');
    });

    it("should increment/decrement value on click", function() {
      view.render();
      view.$('.plus').trigger('click');
      expect(view.$('.value').html()).toEqual('1');
      expect(model.get('test')).toEqual(1);
      view.$('.minus').trigger('click');
      expect(view.$('.value').html()).toEqual('0');
      expect(model.get('test')).toEqual(0);
    });
  });


});
