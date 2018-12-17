# encoding: utf-8

require 'spec_helper_min'

module Carto
  describe 'PasswordValidator' do
    PASSWORD = '2{Patrañas}'.freeze

    it 'should be invalid when password too short' do
      strong_validator = Carto::StrongPasswordValidator.new(min_length: PASSWORD.length + 1)
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate(PASSWORD, PASSWORD)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must be at least #{PASSWORD.length + 1} characters long"
    end

    it 'should be invalid when same as username' do
      validator = Carto::PasswordValidator.new

      user = mock
      user.stubs(:username).returns(PASSWORD)
      user.stubs(:organization).returns(nil)

      errors = validator.validate(PASSWORD, PASSWORD, user)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must be different than the user name"
    end

    it 'should check strong passwords for org users with strong_passwords_enabled' do
      user = mock
      org = mock
      org.stubs(:strong_passwords_enabled).returns(true)
      user.stubs(:username).returns(PASSWORD)
      user.stubs(:organization_user?).returns(true)
      user.stubs(:organization).returns(org)

      strong_validator = Carto::StrongPasswordValidator.new(min_length: PASSWORD.length + 1)
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate(PASSWORD, PASSWORD, user)
      errors.empty?.should be_false
      error = "must be different than the user name and must be at least #{PASSWORD.length + 1} characters long"
      validator.formatted_error_message(errors).should == error
    end

    it 'should be invalid when in common password list' do
      strong_validator = Carto::StrongPasswordValidator.new
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate('123456789q', '123456789q')
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "common passwords are not allowed"
    end

    it 'should be invalid when password too long' do
      strong_validator = Carto::StrongPasswordValidator.new(max_length: PASSWORD.length - 1)
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate(PASSWORD, PASSWORD)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must be at most #{PASSWORD.length - 1} characters long"
    end

    it 'should be invalid when password does not have enough letters' do
      strong_validator = Carto::StrongPasswordValidator.new(min_letters: 9)
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate(PASSWORD, PASSWORD)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must contain at least 9 letters"
    end

    it 'should be invalid when password does not have enough numbers or symbols' do
      strong_validator = Carto::StrongPasswordValidator.new(min_symbols: 3, min_numbers: 2)
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate(PASSWORD, PASSWORD)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "must contain at least 3 symbols or 2 numbers"
    end

    it 'should be valid when password has enough numbers but not enough symbols' do
      strong_validator = Carto::StrongPasswordValidator.new(min_symbols: 3, min_numbers: 1)
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate(PASSWORD, PASSWORD)
      errors.empty?.should be_true
      validator.formatted_error_message(errors).should be_nil
    end

    it 'should be valid when password has enough symbols but not enough numbers' do
      strong_validator = Carto::StrongPasswordValidator.new(min_symbols: 2, min_numbers: 3)
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate(PASSWORD, PASSWORD)
      errors.empty?.should be_true
      validator.formatted_error_message(errors).should be_nil
    end

    it 'should invalidate a nil password' do
      strong_validator = Carto::StrongPasswordValidator.new
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate(nil, nil)
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == "New password can't be blank"
    end

    it 'should invalidate an empty password' do
      strong_validator = Carto::StrongPasswordValidator.new
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate('', '')
      errors.empty?.should be_false
      validator.formatted_error_message(errors).should == 'must be at least 8 characters long, must contain at ' +
                                                          'least 1 letter and must contain at least 1 symbol or ' +
                                                          '1 number'
    end

    it 'should return an error array' do
      strong_validator = Carto::StrongPasswordValidator.new
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate(nil, nil)
      errors.empty?.should be_false

      message = validator.formatted_error_message(errors)
      message.should == "New password can't be blank"

      errors.each do |error|
        message.should include(error)
      end
    end

    it 'should validate a good password' do
      strong_validator = Carto::StrongPasswordValidator.new
      validator = Carto::PasswordValidator.new(strong_validator)

      errors = validator.validate(PASSWORD, PASSWORD)
      errors.empty?.should be_true
      validator.formatted_error_message(errors).should be_nil
    end
  end
end
