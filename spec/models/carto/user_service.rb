# coding: UTF-8
require_relative '../../spec_helper'

describe Carto::UserService do
  before(:all) do
    @user = create_user({
        email: 'admin@cartotest.com', 
        username: 'admin', 
        password: '123456'
      })
  end

  before(:each) do
    delete_user_data(@user)
  end

  after(:all) do
    @user.destroy
  end

  it "Tests  in_database() settimeout option" do
    custom_timeout = 123456
    expected_returned_custom_timeout = { statement_timeout: "#{custom_timeout}ms" }

    @returned_timeout = nil
    @default_timeout = nil
    @returned_timeout_new = nil
    @default_timeout_new = nil

    old_model_user = create_user({
        email: 'adminold@cartotest.com', 
        username: 'adminold', 
        password: '123456'
      })

    old_model_user.in_database do |db|
      @default_timeout = db[%Q{SHOW statement_timeout}].first
    end

    old_model_user.in_database({statement_timeout: custom_timeout}) do |db|
      @returned_timeout = db[%Q{SHOW statement_timeout}].first
    end

    @returned_timeout.should eq expected_returned_custom_timeout
    @default_timeout.should_not eq @returned_timeout

    old_model_user.in_database do |db|
      @default_timeout.should eq db[%Q{SHOW statement_timeout}].first
    end

    old_model_user.destroy

    user = Carto::User.where(id: @user.id).first

    user.in_database do |db|
      @default_timeout_new = db.execute(%Q{SHOW statement_timeout}).first
    end

    user.in_database({statement_timeout: custom_timeout}) do |db|
      @returned_timeout_new = db.execute(%Q{SHOW statement_timeout}).first
    end

    @returned_timeout_new.should eq expected_returned_custom_timeout
    @default_timeout_new.should_not eq @returned_timeout_new

    user.in_database do |db|
      @default_timeout_new.should eq db.execute(%Q{SHOW statement_timeout}).first
    end

    @returned_timeout_new.should eq @returned_timeout
    @default_timeout_new.should eq @default_timeout

  end
end