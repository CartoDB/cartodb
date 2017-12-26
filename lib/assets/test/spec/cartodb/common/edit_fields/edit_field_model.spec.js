var cdb = require('cartodb.js-v3');
var EditFieldModel = require('../../../../../javascripts/cartodb/common/edit_fields/edit_field_model');

describe('common/edit_fields/edit_field_model', function() {

  beforeEach(function() {
    this.model = new EditFieldModel({
      type: 'number',
      attribute: 'hello',
      value: 1
    });
  });

  it("should have error and valid bindings by default", function() {
    expect(this.model.validationError).not.toBeUndefined();
    spyOn(this.model, 'bind').and.callThrough();
    this.model.initialize();
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('valid');
    expect(this.model.bind.calls.argsFor(1)[0]).toEqual('error');
  });

  describe('number_validation', function() {

    beforeEach(function(){
      this.model.set({
        type: 'number'
      })
    });

    it('should be valid when it is only composed by numbers', function(){
      this.model.set('value','+123.34');
      expect(this.model.isValid()).toBeTruthy();
      this.model.set('value','-123.34');
      expect(this.model.isValid()).toBeTruthy();
      this.model.set('value','34');
      expect(this.model.isValid()).toBeTruthy();
      this.model.set('value','0');
      expect(this.model.isValid()).toBeTruthy();
      this.model.set('value','10');
      expect(this.model.isValid()).toBeTruthy();
      this.model.set('value','01');
      expect(this.model.isValid()).toBeTruthy();
      this.model.set('value','0.1');
      expect(this.model.isValid()).toBeTruthy();
      this.model.set('value','.1');
      expect(this.model.isValid()).toBeTruthy();
    });

    it('should be unvalid when it is not only composed by numbers or not well formed', function(){
      this.model.set('value','+1.23.34');
      expect(this.model.isValid()).toBeFalsy();
      this.model.set('value','e34');
      expect(this.model.isValid()).toBeFalsy();
      this.model.set('value',true);
      expect(this.model.isValid()).toBeFalsy();
      this.model.set('value','1.a2');
      expect(this.model.isValid()).toBeFalsy();
    });

  });

  describe('boolean_validation', function() {
    beforeEach(function(){
      this.model.set({
        type: 'boolean',
        value: true
      })
    });

    it('should be valid when it is true, false or null', function(){
      this.model.set('value',true);
      expect(this.model.isValid()).toBeTruthy();
      this.model.set('value',false);
      expect(this.model.isValid()).toBeTruthy();
      this.model.set('value',null);
      expect(this.model.isValid()).toBeTruthy();
    });

    it('should be unvalid when it is not a boolean value', function(){
      this.model.set('value','true');
      expect(this.model.isValid()).toBeFalsy();
      this.model.set('value',1);
      expect(this.model.isValid()).toBeFalsy();
      this.model.set('value',0);
      expect(this.model.isValid()).toBeFalsy();
      this.model.set('value','hello');
      expect(this.model.isValid()).toBeFalsy();
      this.model.set('value','null');
      expect(this.model.isValid()).toBeFalsy();
    });
  });

  it("should return if model is unvalid when validation fails or validationError is not empty", function() {
    var errorTrigger = false;
    this.model.bind('error', function() {
      errorTrigger = true;
    });
    this.model.set('value', 'paco');
    expect(this.model.isValid()).toBe(false);
    expect(this.model.validationError).not.toBe('');
    expect(errorTrigger).toBeTruthy();
  });  

  it("should return if model is valid when validation passes and validationError is empty", function() {
    var validTrigger = false;
    this.model.bind('valid', function() {
      validTrigger = true;
    });
    this.model.set('value', '+10.0');
    expect(this.model.isValid()).toBe(true);
    expect(this.model.validationError).toBe('');
    expect(validTrigger).toBeTruthy();
  });

  it("should return validationError", function() {
    this.model.validationError = "har";
    expect(this.model.getError()).toBe("har");
  });

});