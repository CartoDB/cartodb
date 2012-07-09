#encoding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../../spec_helper')

describe "Imports API" do

  before(:each) do
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
    @user.set_map_key

  end

  it 'allows users to perform asynchronous imports' do

    post v1_imports_url(:host => 'test.localhost.lan'), :file_uri => upload_file('spec/support/data/column_boolean_to_string.csv', 'text/plain'), :api_key => @user.get_map_key

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    response_json['item_queue_id'].should_not be_empty

    last_import = DataImport.order(:updated_at.desc).first
    last_import.queue_id.should be == response_json['item_queue_id']
    last_import.state.should be == 'preprocessing'
  end

  it 'allows users to get a list of all performed imports' do
    %w(column_boolean_to_string column_number_to_boolean column_number_to_string column_string_to_boolean).each do |file_name|
      post v1_imports_url(:host => 'test.localhost.lan'), :file_uri => upload_file("spec/support/data/#{file_name}.csv", 'text/plain'), :api_key => @user.get_map_key
    end

    get v1_imports_url(:host => 'test.localhost.lan'), :api_key => @user.get_map_key

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    imports = response_json['imports']
    imports.should have(4).items
  end

  it 'allows users to get the detail of an import' do
    post v1_imports_url(:host => 'test.localhost.lan'), :file_uri       => upload_file('spec/support/data/clubbing.csv', 'text/plain'),
                                                        :table_name     => 'wadus',
                                                        :api_key        => @user.get_map_key
    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get v1_import_url(:host => 'test.localhost.lan', :id => item_queue_id), :api_key => @user.get_map_key

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    import = response_json['import']
    import['state'].should be == 'complete'
  end

  it 'allows users to get a list of pending imports'
  it 'allows users to get a list of failed imports'
  it 'allows users to get a list of succeeded imports'
  it 'allows users to kill pending imports'

end
