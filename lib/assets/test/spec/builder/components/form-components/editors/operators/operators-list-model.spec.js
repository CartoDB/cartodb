var OperatorsListModel = require('builder/components/form-components/editors/operators/operators-list-model');

describe('components/form-components/operators/operators-list-model', function () {
  beforeEach(function () {
    this.model = new OperatorsListModel({
      operator: 'count',
      attribute: ''
    });
  });

  describe('.isValidOperator', function () {
    it('should be true when operator is count', function () {
      expect(this.model.isValidOperator()).toBeTruthy();
    });

    it('should be valid when operator is different than count and there is an attribute', function () {
      this.model.attributes = {
        operator: 'sum',
        attribute: '$'
      };
      expect(this.model.isValidOperator()).toBeTruthy();
    });

    it('should be unvalid when operator is different than count and there is no an attribute', function () {
      this.model.attributes = {
        operator: 'sum',
        attribute: ''
      };
      expect(this.model.isValidOperator()).toBeFalsy();
    });

    it('should be unvalid when operator is empty and there is an attribute', function () {
      this.model.attributes = {
        operator: '',
        attribute: '$'
      };
      expect(this.model.isValidOperator()).toBeFalsy();
    });
  });
});
