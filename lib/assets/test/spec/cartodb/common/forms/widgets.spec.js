
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
      }
    ]; 
    view = new cdb.forms.Form({
      form_data: simple_form
    });

  });

  it('should render form fields', function() {
    view.render();
    expect(view.$('li').length).toEqual(1);
    expect(view.$('.form_color').length).toEqual(1);
    expect(view.$('.form_spinner').length).toEqual(1);
    expect(_.keys(view._subviews).length).toEqual(2);
  });

  it('should has a model with properties', function() {
    view.render();
    expect(view.model.get('polygon-fill')).toEqual('#00FF00');
    expect(view.model.get('polygon-opacity')).toEqual(0.6);
  });

});
