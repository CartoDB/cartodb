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

  it 'tries to import a tgz' do

    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/Weird Filename (2).tgz', 'application/octet-stream'))

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'
    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
  end

  it 'fails with password protected files' do
    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/alldata-pass.zip', 'application/octet-stream'))

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'
    import = JSON.parse(response.body)
    import['state'].should be == 'failure'
  end

  it 'imports files with weird filenames' do
    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/Weird Filename (2).csv', 'application/octet-stream'))

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'
    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
  end

  it 'creates a table from a sql query' do
    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/_penguins_below_80.zip', 'application/octet-stream'))

    response.code.should be == '200'

    @table_from_import = UserTable.all.last.service

    post api_v1_imports_create_url(:api_key    => @user.api_key,
                        :table_name => 'wadus_2',
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
         params.merge({
                        filename: upload_file('spec/support/data/csv_with_lat_lon.csv', 'application/octet-stream'),
                        create_vis: true
                      })
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

end
