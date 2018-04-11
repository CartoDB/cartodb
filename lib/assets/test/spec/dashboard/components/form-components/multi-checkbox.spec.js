const Backbone = require('backbone');
require('dashboard/components/form-components');

describe('dashboard/components/form-components/multi-checkbox', function () {
  let component;

  const createViewFn = function (options) {
    const componentOptions = Object.assign({},
      {
        key: 'multicheckbox',
        schema: {
          editorAttrs: { disabled: false },
          inputs: [
            { name: 'maps', label: 'maps' },
            { name: 'sql' }
          ]
        },
        model: new Backbone.Model({
          multicheckbox: {
            maps: true,
            sql: false
          }
        })
      },
      options
    );

    const component = new Backbone.Form.editors.MultiCheckbox(componentOptions);

    return component;
  };

  beforeEach(function () {
    component = createViewFn();
  });

  it('should render checkboxes properly', function () {
    expect(component.$('input').length).toBe(2);

    // Maps Checkbox
    const mapsCheckboxContainer = component.$('.FormAccount-rowData div:first-child');
    const mapsCheckbox = mapsCheckboxContainer.find('input');

    expect(mapsCheckbox.length).toBe(1);
    expect(mapsCheckbox.attr('name')).toBe('maps');
    expect(mapsCheckbox.is(':checked')).toBe(true);
    expect(mapsCheckbox.attr('disabled')).toBeFalsy();

    const mapsLabel = mapsCheckboxContainer.find('label');
    expect(mapsLabel.text()).toBe('maps');

    // SQL Checkbox
    const sqlCheckboxContainer = component.$('.FormAccount-rowData div:last-child');
    const sqlCheckbox = sqlCheckboxContainer.find('input');

    expect(sqlCheckbox.length).toBe(1);
    expect(sqlCheckbox.attr('name')).toBe('sql');
    expect(sqlCheckbox.is(':checked')).toBe(false);
    expect(sqlCheckbox.attr('disabled')).toBeFalsy();

    const sqlLabel = sqlCheckboxContainer.find('label');
    expect(sqlLabel.text()).toBe('sql');
  });

  it('should render disabled checkboxes', function () {
    const component = createViewFn({
      schema: {
        editorAttrs: { disabled: true },
        inputs: [
          { name: 'maps', label: 'maps' },
          { name: 'sql' }
        ]
      }
    });

    expect(component.$('input').length).toBe(2);
    expect(component.$('input').first().attr('disabled')).toBe('disabled');
  });

  describe('._validate', function () {
    it('should validate that any checkbox is checked', function () {
      expect(component.validate()).toBeNull();

      component.value.maps = false;
      expect(component.validate()).toEqual({
        type: 'required',
        message: 'Required'
      });
    });
  });

  describe('._onCheckboxClick', function () {
    it('should check checkbox when clicking', function () {
      spyOn(component, 'trigger');

      component._onCheckboxClick({
        target: {
          name: 'sql',
          checked: true
        }
      });

      expect(component.getValue()).toEqual({
        maps: true, sql: true
      });
      expect(component.trigger).toHaveBeenCalledWith('change', component);
    });
  });

  describe('._hasValue', function () {
    it('should return true if any checkbox is checked', function () {
      expect(component._hasValue()).toBe(true);

      component.value.maps = false;
      expect(component._hasValue()).toBe(false);
    });
  });
});
