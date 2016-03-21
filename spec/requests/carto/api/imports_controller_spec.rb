# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../api/json/imports_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/imports_controller'
require 'helpers/random_names_helper'

describe Carto::Api::ImportsController do
  include RandomNamesHelper
  it_behaves_like 'imports controllers' do
  end

  @headers = { 'CONTENT_TYPE'  => 'application/json' }

  before(:all) do
    @user = FactoryGirl.create(:valid_user)
    host! "#{@user.username}.localhost.lan"
  end

  after(:all) do
    @user.destroy
  end

  before(:each) do
    stub_named_maps_calls
    delete_user_data @user
  end

  let(:params) { { api_key: @user.api_key } }

  it 'gets a list of all pending imports' do
    Resque.inline = false
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post api_v1_imports_create_url, params.merge(url: url, table_name: 'wadus')
    end

    get api_v1_imports_index_url, params

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    imports = response_json['imports']
    imports.should have(1).items
    Resque.inline = true
  end

  it "doesn't return old pending imports" do
    Resque.inline = false
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post api_v1_imports_create_url, params.merge(url: url, table_name: 'wadus')
    end

    Delorean.jump(7.hours)
    get api_v1_imports_index_url, params

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    imports = response_json['imports']
    imports.should have(0).items
    Resque.inline = true
    Delorean.back_to_the_present
  end

  it 'gets the detail of an import' do
    post api_v1_imports_create_url(api_key: @user.api_key, table_name: 'wadus', filename: File.basename('wadus.csv')),
         upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'

    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
    import['display_name'].should be == 'wadus.csv'
  end

  it 'gets the detail of an import stuck unpacking' do
    post api_v1_imports_create_url(api_key: @user.api_key, table_name: 'wadus', filename: File.basename('wadus.csv')),
         upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')

    response_json = JSON.parse(response.body)
    last_import = DataImport[response_json['item_queue_id']]
    last_import.state = DataImport::STATE_UNPACKING
    last_import.created_at -= 5.years
    last_import.save

    get api_v1_imports_show_url(:id => last_import.id), params

    response.code.should be == '200'

    import = JSON.parse(response.body)
    import['state'].should be == 'stuck'
  end

  it 'tries to import a tgz' do

    post api_v1_imports_create_url,
         params.merge(filename: upload_file('spec/support/data/Weird Filename (2).tgz', 'application/octet-stream'))

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'
    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
    import['display_name'].should be == 'Weird_Filename_(2).tgz'
  end

  it 'fails with password protected files' do
    post api_v1_imports_create_url,
         params.merge(filename: upload_file('spec/support/data/alldata-pass.zip', 'application/octet-stream'))

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'
    import = JSON.parse(response.body)
    import['state'].should be == 'failure'
  end

  it 'imports files with weird filenames' do
    post api_v1_imports_create_url,
         params.merge(filename: upload_file('spec/support/data/Weird Filename (2).csv', 'application/octet-stream'))

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'
    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
  end

  it 'creates a table from a sql query' do
    post api_v1_imports_create_url,
         params.merge(filename: upload_file('spec/support/data/_penguins_below_80.zip', 'application/octet-stream'))

    response.code.should be == '200'

    @table_from_import = UserTable.all.last.service
    post api_v1_imports_create_url(:api_key    => @user.api_key,
                        table_name: 'wadus_2',
                        :sql        => "SELECT * FROM #{@table_from_import.name}")


    response.code.should be == '200'

    response_json = JSON.parse(response.body)

    last_import = DataImport[response_json['item_queue_id']]
    last_import.state.should be == 'complete'

    import_table = UserTable.all.last.service
    import_table.rows_counted.should be == @table_from_import.rows_counted
    import_table.should have_required_indexes_and_triggers
  end

  it 'returns derived visualization id if created with create_vis flag' do
    @user.update private_tables_enabled: false
    post api_v1_imports_create_url,
         params.merge({filename: upload_file('spec/support/data/csv_with_lat_lon.csv', 'application/octet-stream'),
                       create_vis: true})
    response.code.should be == '200'

    item_queue_id = ::JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(id: item_queue_id), params

    import = DataImport[item_queue_id]

    import.state.should be == 'complete'
    import.visualization_id.nil?.should eq false
    import.create_visualization.should eq true

    vis = CartoDB::Visualization::Member.new(id: import.visualization_id).fetch
    vis.nil?.should eq false
    vis.name =~ /csv_with_lat_lon/  # just in case we change the prefix

    @user.update private_tables_enabled: true
  end

  describe 'service_token_valid?' do
    it 'returns oauth_valid false for unknown service tokens' do
      get api_v1_imports_service_token_valid_url(id: 'kk'), params
      response.code.should == '200'
      response_json = JSON.parse(response.body)
      response_json['oauth_valid'].should == false
      response_json['success'].should == true
    end

    it 'returns 400 for known service token without known service datasource' do
      synchronization_oauth = Carto::SynchronizationOauth.new(user_id: @user.id, service: 'kk-s', token: 'kk-t')
      synchronization_oauth.save
      get api_v1_imports_service_token_valid_url(id: synchronization_oauth.service), params
      response.code.should == '400'
      synchronization_oauth.destroy
    end

    it 'returns 400 for known service token for a service datasource which is not BaseOAuth' do
      synchronization_oauth = Carto::SynchronizationOauth.new(user_id: @user.id, service: 'arcgis', token: 'kk-t')
      synchronization_oauth.save
      get api_v1_imports_service_token_valid_url(id: synchronization_oauth.service), params
      response.code.should == '400'
      synchronization_oauth.destroy
    end

    it 'returns oauth_valid false for not valid tokens and deletes them' do
      CartoDB::Datasources::Url::MailChimp.any_instance.stubs(:token_valid?).returns(false)
      synchronization_oauth = Carto::SynchronizationOauth.new(user_id: @user.id, service: 'mailchimp', token: 'kk-t')
      synchronization_oauth.save
      get api_v1_imports_service_token_valid_url(id: synchronization_oauth.service), params
      response.code.should == '200'
      response_json = JSON.parse(response.body)
      response_json['oauth_valid'].should == false
      response_json['success'].should == true

      SynchronizationOauth.where(id: synchronization_oauth.id).first.should eq nil
      synchronization_oauth.destroy
    end

    it 'returns 401 for expired tokens on assignment and deletes them' do
      CartoDB::Datasources::Url::MailChimp.any_instance.stubs(:token=).raises(CartoDB::Datasources::TokenExpiredOrInvalidError.new('kk', 'mailchimp'))
      synchronization_oauth = Carto::SynchronizationOauth.new(user_id: @user.id, service: 'mailchimp', token: 'kk-t')
      synchronization_oauth.save

      get api_v1_imports_service_token_valid_url(id: synchronization_oauth.service), params, @headers
      response.code.should == '401'

      SynchronizationOauth.where(id: synchronization_oauth.id).first.should eq nil
      synchronization_oauth.destroy
    end

    it 'returns 401 for expired tokens on validation and deletes them' do
      CartoDB::Datasources::Url::MailChimp.any_instance.stubs(:token_valid?).raises(CartoDB::Datasources::TokenExpiredOrInvalidError.new('kk', 'mailchimp'))
      synchronization_oauth = Carto::SynchronizationOauth.new(user_id: @user.id, service: 'mailchimp', token: 'kk-t')
      synchronization_oauth.save

      get api_v1_imports_service_token_valid_url(id: synchronization_oauth.service), params, @headers
      response.code.should == '401'

      SynchronizationOauth.where(id: synchronization_oauth.id).first.should eq nil
      synchronization_oauth.destroy
    end

  end

  describe 'list_files_for_service' do

    def fake_item_data(datasource_name = 'fake_datasource')
      id = random_integer
      {
        id:       id,
        title:    "title_#{id}",
        filename: "filename_#{id}",
        service:  datasource_name,
        checksum: id,
        size:     rand(50)
      }
    end

    def fake_resource_list(datasource_name = 'fake_datasource')
      [ fake_item_data(datasource_name), fake_item_data(datasource_name) ]
    end

    it 'returns datasource resources list for known, valid tokens' do
      service = 'mailchimp'
      fake_files = fake_resource_list(service)
      CartoDB::Datasources::Url::MailChimp.any_instance.stubs(:get_resources_list).returns(fake_files)
      synchronization_oauth = Carto::SynchronizationOauth.new(user_id: @user.id, service: service, token: 'kk-t')
      synchronization_oauth.save
      get api_v1_imports_service_list_files_url(id: service), params
      response.code.should == '200'
      response_json = JSON.parse(response.body)
      response_json['success'].should == true
      response_json['files'].map(&:symbolize_keys).should == fake_files
      synchronization_oauth.destroy
    end

    it 'returns 401 for expired tokens on resource listing and deletes them' do
      CartoDB::Datasources::Url::MailChimp.any_instance.stubs(:get_resources_list).raises(CartoDB::Datasources::TokenExpiredOrInvalidError.new('kk', 'mailchimp'))
      synchronization_oauth = Carto::SynchronizationOauth.new(user_id: @user.id, service: 'mailchimp', token: 'kk-t')
      synchronization_oauth.save

      get api_v1_imports_service_list_files_url(id: 'mailchimp'), params
      response.code.should == '401'

      SynchronizationOauth.where(id: synchronization_oauth.id).first.should eq nil
      synchronization_oauth.destroy
    end

  end

  describe 'auth_url' do

    it 'returns 400 for existing tokens services' do
      service = 'mailchimp'
      synchronization_oauth = Carto::SynchronizationOauth.new(user_id: @user.id, service: service, token: 'kk-t')
      synchronization_oauth.save
      get api_v1_imports_service_auth_url_url(id: service), params
      response.code.should == '400'
      synchronization_oauth.destroy
    end

    it 'returns auth url for known, valid tokens' do
      service = 'mailchimp'
      fake_url = 'http://www.fakeurl.com'
      CartoDB::Datasources::Url::MailChimp.any_instance.stubs(:get_auth_url).returns(fake_url)
      get api_v1_imports_service_auth_url_url(id: service), params
      response.code.should == '200'
      response_json = JSON.parse(response.body)
      response_json['success'].should == true
      response_json['url'].should == fake_url
    end

    it 'returns 401 for expired tokens on url and deletes them' do
      CartoDB::Datasources::Url::MailChimp.any_instance.stubs(:get_auth_url).raises(CartoDB::Datasources::TokenExpiredOrInvalidError.new('kk', 'mailchimp'))

      get api_v1_imports_service_auth_url_url(id: 'mailchimp'), params
      response.code.should == '401'

      # INFO: this can never happen with the current implementation of get_service_auth_url, since it first checks there's no previous SynchronizationOauth
      SynchronizationOauth.where(service: 'mailchimp').first.should eq nil
    end
  end

  describe 'validate_service_oauth_code' do

    it 'returns 400 for existing tokens services' do
      service = 'mailchimp'
      synchronization_oauth = Carto::SynchronizationOauth.new(user_id: @user.id, service: service, token: 'kk-t')
      synchronization_oauth.save
      get api_v1_imports_service_validate_code_url(id: service, code: 'kk'), params
      response.code.should == '400'
      synchronization_oauth.destroy
    end

    it 'returns 400 if it does not find datasource' do
      CartoDB::Datasources::DatasourcesFactory.stubs(:get_datasource).returns(nil)
      get api_v1_imports_service_validate_code_url(id: 'kk', code: 'kk'), params
      response.code.should == '400'
    end

    it 'returns 401 for expired tokens on url and deletes them' do
      CartoDB::Datasources::DatasourcesFactory.stubs(:get_datasource).raises(CartoDB::Datasources::TokenExpiredOrInvalidError.new('kk', 'mailchimp'))

      get api_v1_imports_service_validate_code_url(id: 'mailchimp', code: 'kk'), params
      response.code.should == '401'

      # INFO: this can never happen with the current implementation since it first checks there's no previous SynchronizationOauth
      SynchronizationOauth.where(service: 'mailchimp').first.should eq nil
    end

    it 'returns not success 200 and does not store oauth for not valid codes' do
      CartoDB::Datasources::Url::MailChimp.any_instance.stubs(:validate_auth_code).raises(CartoDB::Datasources::AuthError.new)

      get api_v1_imports_service_validate_code_url(id: 'mailchimp', code: 'kk'), params
      response.code.should == '200'
      response_json = JSON.parse(response.body)
      response_json['success'].should == false

      SynchronizationOauth.where(service: 'mailchimp').first.should eq nil
    end

    it 'returns 400 if validation fails catastrophically' do
      CartoDB::Datasources::Url::MailChimp.any_instance.stubs(:validate_auth_code).raises(StandardError.new)

      get api_v1_imports_service_validate_code_url(id: 'mailchimp', code: 'kk'), params
      response.code.should == '400'

      # INFO: this can never happen with the current implementation since it first checks there's no previous SynchronizationOauth
      SynchronizationOauth.where(service: 'mailchimp').first.should eq nil
    end

    it 'returns success 200 and stores oauth for valid codes' do
      token = 'kk'
      CartoDB::Datasources::Url::MailChimp.any_instance.stubs(:validate_auth_code).returns(token)

      get api_v1_imports_service_validate_code_url(id: 'mailchimp', code: 'kk'), params
      response.code.should == '200'
      response_json = JSON.parse(response.body)
      response_json['success'].should == true

      synchronization_oauth = SynchronizationOauth.where(service: 'mailchimp').first
      synchronization_oauth.token.should eq token
      synchronization_oauth.user_id.should eq @user.id
      synchronization_oauth.destroy
    end

  end

  describe 'service_oauth_callback' do

    it 'returns 400 for existing tokens services' do
      service = 'mailchimp'
      synchronization_oauth = Carto::SynchronizationOauth.new(user_id: @user.id, service: service, token: 'kk-t')
      synchronization_oauth.save
      get api_v1_imports_service_oauth_callback_url(id: service), params
      response.code.should == '400'
      synchronization_oauth.destroy
    end

    it 'returns 401 for expired tokens and deletes them' do
      CartoDB::Datasources::DatasourcesFactory.stubs(:get_datasource).raises(CartoDB::Datasources::TokenExpiredOrInvalidError.new('kk', 'mailchimp'))

      get api_v1_imports_service_oauth_callback_url(id: 'mailchimp'), params
      response.code.should == '401'

      # INFO: this can never happen with the current implementation since it first checks there's no previous SynchronizationOauth
      SynchronizationOauth.where(service: 'mailchimp').first.should eq nil
    end

    it 'returns success 200 and stores oauth for valid params' do
      token = 'kk'
      CartoDB::Datasources::Url::MailChimp.any_instance.stubs(:validate_callback).returns(token)

      get api_v1_imports_service_oauth_callback_url(id: 'mailchimp'), params
      response.code.should == '200'
      response.body.should == '<script>window.close();</script>'

      synchronization_oauth = SynchronizationOauth.where(service: 'mailchimp').first
      synchronization_oauth.token.should eq token
      synchronization_oauth.user_id.should eq @user.id
      synchronization_oauth.destroy
    end

  end

end
