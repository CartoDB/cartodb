# encoding: utf-8

require 'spec_helper_min'

describe Carto::StrongPasswordValidator do
  describe('#validate') do
    let(:password) { '2{Patrañas}' }

    it 'should be invalid when password too short' do
      validator = Carto::StrongPasswordValidator.new(min_length: password.length + 1)

      errors = validator.validate(password)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must be at least #{password.length + 1} characters long"
    end

    it 'should be invalid when password too long' do
      validator = Carto::StrongPasswordValidator.new(max_length: password.length - 1)

      errors = validator.validate(password)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must be at most #{password.length - 1} characters long"
    end

    it 'should be invalid when password does not have enough letters' do
      validator = Carto::StrongPasswordValidator.new(min_letters: 9)

      errors = validator.validate(password)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must contain at least 9 letters"
    end

    it 'should be invalid when password does not have enough numbers or symbols' do
      validator = Carto::StrongPasswordValidator.new(min_symbols: 3, min_numbers: 2)

      errors = validator.validate(password)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must contain at least 3 symbols or 2 numbers"
    end

    it 'should be valid when password has enough numbers but not enough symbols' do
      validator = Carto::StrongPasswordValidator.new(min_symbols: 3, min_numbers: 1)

      errors = validator.validate(password)
      errors.empty?.should be_true
      validator.formatted_error_message(errors).should be_nil
    end

    it 'should be valid when password has enough symbols but not enough numbers' do
      validator = Carto::StrongPasswordValidator.new(min_symbols: 2, min_numbers: 3)

      errors = validator.validate(password)
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

      errors = validator.validate(password)
      errors.empty?.should be_true
      validator.formatted_error_message(errors).should be_nil
    end
  end

  describe('#suggest suggests valid passwords') do
    it 'for max length' do
      @validator = Carto::StrongPasswordValidator.new(max_length: 10)
    end

    it 'for min length' do
      @validator = Carto::StrongPasswordValidator.new(max_length: 1024)
    end

    it 'for min symbols' do
      @validator = Carto::StrongPasswordValidator.new(max_length: 20)
    end

    it 'for min letters' do
      @validator = Carto::StrongPasswordValidator.new(max_length: 20)
    end

    it 'for min numbers' do
      @validator = Carto::StrongPasswordValidator.new(max_length: 20)
    end

    after(:each) do
      @validator.validate(@validator.suggest).should be_empty
    end
  end
end
