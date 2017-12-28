# coding: UTF-8
require_relative '../../spec_helper'

describe Carto::UserService do
  before(:all) do
    @user = FactoryGirl.create(:valid_user)
  end

  before(:each) do
    delete_user_data(@user)
    $pool.close_connections!
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  it "Tests in_database() settimeout option" do
    custom_timeout = 123456
    expected_returned_custom_timeout = { statement_timeout: "#{custom_timeout}ms" }

    @returned_timeout = nil
    @default_timeout = nil
    @returned_timeout_new = nil
    @default_timeout_new = nil

    @user.in_database do |db|
      @default_timeout = db[%{SHOW statement_timeout}].first
    end

    @user.in_database(statement_timeout: custom_timeout) do |db|
      @returned_timeout = db[%{SHOW statement_timeout}].first
    end

    @returned_timeout.should eq expected_returned_custom_timeout
    @default_timeout.should_not eq @returned_timeout

    @user.in_database do |db|
      @default_timeout.should eq db[%{SHOW statement_timeout}].first
    end

    # Now test with CARTO user
    carto_user = Carto::User.find(@user.id)

    carto_user.in_database do |db|
      @default_timeout_new = db.execute(%{SHOW statement_timeout}).first
    end

    carto_user.in_database(statement_timeout: custom_timeout) do |db|
      @returned_timeout_new = db.execute(%{SHOW statement_timeout}).first
    end

    @returned_timeout_new.symbolize_keys!
    @default_timeout_new .symbolize_keys!

    @returned_timeout_new.should eq expected_returned_custom_timeout
    @default_timeout_new.should_not eq @returned_timeout_new

    carto_user.in_database do |db|
      @default_timeout_new.should eq db.execute(%{SHOW statement_timeout}).first.symbolize_keys
    end

    @default_timeout_new .symbolize_keys!

    @returned_timeout_new.should eq @returned_timeout
    @default_timeout_new.should eq @default_timeout
  end

  it "Tests search_path correctly set" do
    expected_returned_normal_search_path = { search_path: "#{@user.database_schema}, cartodb, cdb_dataservices_client, public" }

    @normal_search_path = nil
    @normal_search_path_new = nil
    @user.in_database do |db|
      @normal_search_path = db[%{SHOW search_path}].first
    end
    @normal_search_path.should eq expected_returned_normal_search_path

    carto_user = Carto::User.find(@user.id)

    carto_user.in_database do |db|
      @normal_search_path_new = db.execute(%{SHOW search_path}).first
    end
    @normal_search_path_new.symbolize_keys!
    @normal_search_path_new.should eq expected_returned_normal_search_path

    @normal_search_path_new.should eq @normal_search_path
  end

  it "tests in_database() with superadmin only operations" do
    carto_user = Carto::User.find(@user.id)
    expect {
      @user.in_database do |conn|
        conn.execute(%{SELECT set_config('log_statement_stats', 'off', false)})
      end
    }.to raise_exception(Sequel::DatabaseError, /permission denied to set parameter "log_statement_stats"/)
    expect {
      carto_user.in_database do |conn|
        conn.execute(%{SELECT set_config('log_statement_stats', 'off', false)})
      end
    }.to raise_exception(ActiveRecord::StatementInvalid, /permission denied to set parameter "log_statement_stats"/)
    @user.in_database(as: :superuser) do |conn|
      conn.execute(%{SELECT set_config('log_statement_stats', 'off', false)})
    end
    carto_user.in_database(as: :superuser) do |conn|
      conn.execute(%{SELECT set_config('log_statement_stats', 'off', false)})
    end
    @user.in_database(as: :cluster_admin) do |conn|
      conn.execute(%{SELECT set_config('log_statement_stats', 'off', false)})
    end
    carto_user.in_database(as: :cluster_admin) do |conn|
      conn.execute(%{SELECT set_config('log_statement_stats', 'off', false)})
    end
  end
end
