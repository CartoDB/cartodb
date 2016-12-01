# encoding: utf-8

require 'spec_helper_min'

module Carto
  describe 'StrongPasswordValidator' do
    PASSWORD = '2{Patrañas}'.freeze

    it 'should be invalid when password too short' do
      validator = Carto::StrongPasswordValidator.new(min_length: PASSWORD.length + 1)

      errors = validator.validate(PASSWORD)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must be at least #{PASSWORD.length + 1} characters long"
    end

    it 'should be invalid when password too long' do
      validator = Carto::StrongPasswordValidator.new(max_length: PASSWORD.length - 1)

      errors = validator.validate(PASSWORD)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must be at most #{PASSWORD.length - 1} characters long"
    end

    it 'should be invalid when password does not have enough letters' do
      validator = Carto::StrongPasswordValidator.new(min_letters: 9)

      errors = validator.validate(PASSWORD)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must contain at least 9 letters"
    end

    it 'should be invalid when password does not have enough numbers or symbols' do
      validator = Carto::StrongPasswordValidator.new(min_symbols: 3, min_numbers: 2)

      errors = validator.validate(PASSWORD)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must contain at least 3 symbols or 2 numbers"
    end

    it 'should be valid when password has enough numbers but not enough symbols' do
      validator = Carto::StrongPasswordValidator.new(min_symbols: 3, min_numbers: 1)

      errors = validator.validate(PASSWORD)
      errors.empty?.should be_true
      validator.formatted_error_message(errors).should be_nil
    end

    it 'should be valid when password has enough symbols but not enough numbers' do
      validator = Carto::StrongPasswordValidator.new(min_symbols: 2, min_numbers: 3)

      errors = validator.validate(PASSWORD)
      errors.empty?.should be_true
      validator.formatted_error_message(errors).should be_nil
    end

    it 'should invalidate a nil password' do
      validator = Carto::StrongPasswordValidator.new

      errors = validator.validate(nil)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == 'must be at least 8 characters long, must contain at ' +
                                                          'least 1 letter and must contain at least 1 symbol or ' +
                                                          '1 number'
    end

    it 'should invalidate an empty password' do
      validator = Carto::StrongPasswordValidator.new

      errors = validator.validate('')
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == 'must be at least 8 characters long, must contain at ' +
                                                          'least 1 letter and must contain at least 1 symbol or ' +
                                                          '1 number'
    end

    it 'should return an error array' do
      validator = Carto::StrongPasswordValidator.new

      errors = validator.validate(nil)
      errors.empty?.should be_false

      message = validator.formatted_error_message(errors)
      message.should == 'must be at least 8 characters long, must contain at least 1 letter and must ' +
                        'contain at least 1 symbol or 1 number'

      errors.each do |error|
        message.should include(error)
      end
    end

    it 'should validate a good password' do
      validator = Carto::StrongPasswordValidator.new

      errors = validator.validate(PASSWORD)
      errors.empty?.should be_true
      validator.formatted_error_message(errors).should be_nil
    end
  end
end
