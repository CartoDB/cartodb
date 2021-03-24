# rubocop:disable RSpec/InstanceVariable

# coding: utf-8
require 'ostruct'
require_relative '../../acceptance_helper'
require_relative '../../factories/organizations_contexts'
require 'carto/user_authenticator'
require 'helpers/account_types_helper'

feature "Superadmin's users API" do
  include Carto::UserAuthenticator
  include AccountTypesHelper

  background do
    Capybara.current_driver = :rack_test
    @new_user = new_user(password: "this_is_a_password")
    @user_atts = @new_user.values
  end

  before(:all) do
    @account_type = create_account_type_fg('FREE')
    @account_type_juliet = create_account_type_fg('Juliet')
  end

  after(:all) do
    @account_type.destroy if @account_type
    @account_type_juliet.destroy if @account_type_juliet
  end

  it 'requires HTTP authentication' do
    get_json superadmin_user_path(create_user), {}

    expect(response.status).to eq(401)
  end

  scenario "user dump success" do
    user = create_user
    dump_url = %r{#{user.database_host}:[0-9]+/scripts/db_dump}
    json_data = { database: user.database_name, username: user.username }
    response_body = {
      retcode: 0,
      return_values: {
        local_file: '/tmp/foo.sql.gz',
        remote_file: 's3://foo-bucket/backups/foo.sql.gz'
      }
    }
    Typhoeus.stub(dump_url,
                  method: :post
                 )
      .and_return(
        Typhoeus::Response.new(code: 200, body: response_body.to_json)
      )

    get_json "/superadmin/users/#{user.id}/dump", {}, superadmin_headers do |response|
      response.status.should == 200
      response.body['retcode'] == 0
    end
    user.destroy
  end

  scenario "user dump fail" do
    user = create_user
    dump_url = %r{#{user.database_host}:[0-9]+/scripts/db_dump}
    json_data = { database: user.database_name, username: user.username }
    Typhoeus.stub(dump_url,
                  method: :post
                 )
      .and_return(
        Typhoeus::Response.new(code: 200, body: '{"retcode": 111}')
      )

    get_json "/superadmin/users/#{user.id}/dump", {}, superadmin_headers do |response|
      response.status.should == 400
      response.body['retcode'] != 0
    end
    user.destroy
  end

  scenario "user dump fail retcode" do
    user = create_user
    dump_url = %r{#{user.database_host}:[0-9]+/scripts/db_dump}
    json_data = { database: user.database_name, username: user.username }
    Typhoeus.stub(dump_url,
                  method: :post
                 )
      .and_return(
        Typhoeus::Response.new(code: 500, body: '{"retcode": 0}')
      )

    get_json "/superadmin/users/#{user.id}/dump", {}, superadmin_headers do |response|
      response.status.should == 400
    end
    user.destroy
  end

  scenario "user get info success" do
    user = create_user
    get_json superadmin_user_path(user), {}, superadmin_headers do |response|
      response.status.should == 200
      response.body[:id].should == user.id
    end

    get_json superadmin_user_path(user.id), {}, superadmin_headers do |response|
      response.status.should == 200
      response.body[:id].should == user.id
    end

    get_json superadmin_user_path(user.username), {}, superadmin_headers do |response|
      response.status.should == 200
      response.body[:id].should == user.id
    end

    user.destroy
  end

  scenario "user get info fail" do
    get_json superadmin_user_path('7b77546f-79cb-4662-9439-9ebafd9627cb'), {}, superadmin_headers do |response|
      response.status.should == 404
    end

    get_json superadmin_user_path('nonexistinguser'), {}, superadmin_headers do |response|
      response.status.should == 404
    end
  end

  describe "GET /superadmin/users" do
    before do
      @user  = create_user
      @user2 = create_user
      @user3 = create_user
      @user4 = create_user
    end

    after do
      @user&.destroy
      @user2&.destroy
      @user3&.destroy
      @user4&.destroy
    end

    it "gets all users" do
      get_json superadmin_users_path, {}, superadmin_headers do |response|
        response.status.should == 200
        response.body.map { |u| u["username"] }.should include(@user.username, @user2.username)
        response.body.length.should >= 2
      end
    end

    it "gets overquota users" do
      ::User.stubs(:overquota).returns [@user]
      Carto::OverquotaUsersService.any_instance.stubs(:get_stored_overquota_users).returns [@user.data]
      get_json superadmin_users_path, { overquota: true }, superadmin_headers do |response|
        response.status.should == 200
        response.body[0]["username"].should == @user.username
        response.body.length.should == 1
      end
    end

    it "gets active Juliet users" do
      @user3.account_type = 'Juliet'
      @user3.state = 'active'
      @user3.save

      @user4.account_type = 'Juliet'
      @user4.state = 'locked'
      @user4.save

      get_json superadmin_users_path, { account_type: 'Juliet', state: 'active' }, superadmin_headers do |response|
        response.status.should == 200
        response.body.length.should eq 1
        response.body[0]["username"].should == @user3.username
        response.body[0].has_key?('table_count').should eq true
        response.body[0].has_key?('public_map_count').should eq true
        response.body[0].has_key?('map_count').should eq true
        response.body[0].has_key?('geocoding_credits_count').should eq true
        response.body[0].has_key?('routing_credits_count').should eq true
        response.body[0].has_key?('isolines_credits_count').should eq true
        response.body[0].has_key?('billing_period').should eq true
        response.body[0].has_key?('regular_api_key_count').should eq true
        response.body[0].has_key?('map_views').should eq true
      end
    end

    it "gets cached db_size_in_bytes_change_users and returns username and db_size_in_bytes_change" do
      cached_users_mock = {
        'username1' => 1111,
        'username2' => 2222
      }
      Carto::UserDbSizeCache.any_instance.expects(:db_size_in_bytes_change_users).once.returns(cached_users_mock)

      get_json superadmin_users_path, { db_size_in_bytes_change: true }, superadmin_headers do |response|
        response.status.should == 200
        users = response.body
        users.length.should == cached_users_mock.length
        users.each do |user|
          user.keys.should == ['username', 'db_size_in_bytes']
        end
        users.each.map { |u| u['username'] }.sort.should == cached_users_mock.keys.sort
        users.each.map { |u| u['db_size_in_bytes'] }.sort.should == cached_users_mock.values.sort
      end
    end

    it "doesn't get organization users" do
      ::User.stubs(:organization).returns(Carto::Organization.new)
      ::User.stubs(:organization_id).returns("organization-id")
      get_json superadmin_users_path, { overquota: true }, superadmin_headers do |response|
        response.status.should == 200
        response.body.length.should == 0
      end
    end
  end

  describe '#data_imports' do
    before(:each) do
      @user = create_user
    end

    after(:each) do
      @user.destroy
    end

    it 'filters results if param status is present' do
      successful_data_import = create(:data_import, user_id: @user.id, success: true, state: 'complete')
      failed_data_import = create(:data_import, user_id: @user.id, success: false, state: 'failure')

      get_json("/superadmin/users/#{@user.id}/data_imports", { status: 'complete' }, superadmin_headers) do |response|
        expect(response.status).to eq(200)

        expect(response.body[:data_imports].size).to eq(1)
        expect(response.body[:data_imports].first[:id]).to eq(successful_data_import.id)
      end

      get_json("/superadmin/users/#{@user.id}/data_imports", { status: 'failure' }, superadmin_headers) do |response|
        expect(response.status).to eq(200)

        expect(response.body[:data_imports].size).to eq(1)
        expect(response.body[:data_imports].first[:id]).to eq(failed_data_import.id)
      end

      get_json("/superadmin/users/#{@user.id}/data_imports", {}, superadmin_headers) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:data_imports].size).to eq(2)
      end
    end

    it 'paginates results' do
      data_imports = create_list(:data_import, 2, user_id: @user.id)
      data_import_ids = data_imports.map(&:id)

      pagination_params = { page: 1, per_page: 1 }

      expect(data_import_ids.size).to eq(2)

      get_json("/superadmin/users/#{@user.id}/data_imports", pagination_params, superadmin_headers) do |response|
        expect(response.status).to eq(200)

        expect(response.body[:data_imports].size).to eq(1)

        expect(response.body[:total_entries]).to eq(2)

        data_import_ids.delete_if { |id| id == response.body[:data_imports][0][:id] }
        expect(data_import_ids.size).to eq(1)
      end

      pagination_params = { page: 2, per_page: 1 }

      get_json("/superadmin/users/#{@user.id}/data_imports", pagination_params, superadmin_headers) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:data_imports].size).to eq(1)

        expect(response.body[:total_entries]).to eq(2)

        data_import_ids.delete_if { |id| id == response.body[:data_imports][0][:id] }
        expect(data_import_ids.size).to eq(0)
      end
    end

    it 'returns all the data imports if no pagination params are present' do
      create_list(:data_import, 3, user_id: @user.id)

      get_json("/superadmin/users/#{@user.id}/data_imports", {}, superadmin_headers) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:data_imports].size).to eq(3)
      end
    end

    it 'validates order param' do
      ['data_imports', 'geocodings', 'synchronizations'].each do |endpoint|
        get_json("/superadmin/users/#{@user.id}/#{endpoint}", { order: :updated_at }, superadmin_headers) do |response|
          response.status.should eq 200
        end

        get_json("/superadmin/users/#{@user.id}/#{endpoint}", { order: :invalid }, superadmin_headers) do |response|
          response.status.should eq 400
          response.body.fetch(:errors).should_not be_nil
        end
      end
    end
  end
end
# rubocop:enable RSpec/InstanceVariable
