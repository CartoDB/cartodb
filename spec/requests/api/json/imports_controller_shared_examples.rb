# encoding: utf-8

require 'spec_helper'

shared_examples_for "imports controllers" do

  before(:all) do
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
    delete_user_data @user
    host! 'test.localhost.lan'
  end

  after(:all) do
    @user.destroy
  end

  let(:params) { { :api_key => @user.api_key } }

  it 'gets a list of all pending imports' do
    Resque.inline = false
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post api_v1_imports_create_url, params.merge(:url        => url,
                                        :table_name => "wadus")
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
      post api_v1_imports_create_url, params.merge(:url        => url,
                                        :table_name => "wadus")
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
    post api_v1_imports_create_url(:api_key => @user.api_key,
                        :table_name => 'wadus',
                        :filename   => File.basename('wadus.csv')),
      upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'

    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
  end

end
