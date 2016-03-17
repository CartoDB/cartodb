# encoding utf-8

require 'spec_helper_min'

module Carto
  describe 'StrongPasswordValidator' do
    PASSWORD = '2{Patrañas}'.freeze

    it 'should be invalid when password too short' do
      validator = Carto::StrongPasswordValidator.new(PASSWORD,
                                                     PASSWORD.length + 1,
                                                     nil,
                                                     nil,
                                                     nil,
                                                     nil)

      validator.valid?.should be_false
      validator.message.should == "must be at least #{PASSWORD.length + 1} characters long"
    end

    it 'should be invalid when password too long' do
      validator = Carto::StrongPasswordValidator.new(PASSWORD,
                                                     nil,
                                                     PASSWORD.length - 1,
                                                     nil,
                                                     nil,
                                                     nil)

      validator.valid?.should be_false
      validator.message.should == "must be at most #{PASSWORD.length - 1} characters long"
    end

    it 'should be invalid when password not enough numbers or symbols' do
      validator = Carto::StrongPasswordValidator.new(PASSWORD,
                                                     nil,
                                                     nil,
                                                     nil,
                                                     3,
                                                     2)

      validator.valid?.should be_false
      validator.message.should == "must contain at least 3 symbols or 2 numbers"
    end

    it 'should be invalidate a nil password' do
      validator = Carto::StrongPasswordValidator.new(nil)

      validator.valid?.should be_false
      validator.message.should == 'must be at least 8 characters long, must contain at least 1 letter and must ' +
                                  'contain at least 1 symbol or 1 number'
    end

    it 'should return an error array' do
      validator = Carto::StrongPasswordValidator.new(nil)

      validator.valid?.should be_false

      message = validator.message
      message.should == 'must be at least 8 characters long, must contain at least 1 letter and must ' +
                        'contain at least 1 symbol or 1 number'

      validator.errors.each do |error|
        message.should include(error)
      end
    end

    it 'should validate a good password' do
      validator = Carto::StrongPasswordValidator.new(PASSWORD)

      validator.valid?.should be_true
      validator.errors.empty?.should be_true
      validator.message.should be_nil
    end
  end
end
