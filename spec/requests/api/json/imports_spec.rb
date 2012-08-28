#encoding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../../../spec_helper')

describe "Imports API" do

  before(:each) do
    User.all.each(&:destroy)
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
    @user.set_map_key
  end

  it 'allows users to perform asynchronous imports' do
    f = upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')
    post v1_imports_url(:host    => 'test.localhost.lan', 
                        :filename  => File.basename('column_number_to_boolean.csv'),
                        :api_key => @user.get_map_key,
                        :table_name => "wadus"), f.read.force_encoding('UTF-8')


    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    response_json['item_queue_id'].should_not be_empty

    last_import = DataImport.order(:updated_at.desc).first
    last_import.queue_id.should be == response_json['item_queue_id']
    last_import.state.should_not be == 'failure'
  end

  it 'allows users to perform synchronous imports' do
  end

  it 'allows users to get a list of all performed imports' do
    %w(column_number_to_boolean column_string_to_boolean).each do |file_name|
      post v1_imports_url(:host => 'test.localhost.lan', 
                          :api_key => @user.get_map_key, 
                          :table_name => file_name, 
                          :filename => File.basename('wadus.csv')), 
                          upload_file("db/fake_data/#{file_name}.csv", 'text/csv').read
    end

    get v1_imports_url(:host => 'test.localhost.lan'), :api_key => @user.get_map_key

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    imports = response_json['imports']
    imports.should have(2).items
  end

  it 'allows users to get the detail of an import' do
    post v1_imports_url(:host => 'test.localhost.lan', 
                        :table_name => 'wadus',
                        :filename => File.basename('wadus.csv'),
                        :api_key => @user.get_map_key),
                        upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get v1_import_url(:host => 'test.localhost.lan', :id => item_queue_id), :api_key => @user.get_map_key

    response.code.should be == '200'

    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
  end

  it 'allows users to import files with weird filenames' do
    post v1_imports_url(:host => 'test.localhost.lan'), :file_uri       => upload_file('spec/support/data/_penguins_below_80 (2).tgz', 'text/plain'),
                                                        :table_name     => '_penguins_below_80\ \(2\).tgz',
                                                        :api_key        => @user.get_map_key

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get v1_import_url(:host => 'test.localhost.lan', :id => item_queue_id), :api_key => @user.get_map_key

    response.code.should be == '200'

    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
  end

  it 'allows users to get a list of pending imports'
  it 'allows users to get a list of failed imports'
  it 'allows users to get a list of succeeded imports'
  it 'allows users to kill pending imports'

end
