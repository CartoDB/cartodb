# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 tables management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user({:username => 'test'})
  end

  before(:each) do
    delete_user_data @user
  end

  scenario "Get tables" do
    get_json api_tables_url do |response|
      response.status.should be_success
      response.body.should == {:total_entries=>0, :tables=>[]}
    end

    another_user = create_user

    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PRIVATE, :tags => "tag 1, tag 2,tag 3, tag 3", :description => 'Testing is awesome'
    table2 = create_table :user_id => @user.id, :name => 'My table #2', :privacy => Table::PRIVATE
    table3 = create_table :user_id => another_user.id, :name => 'Another table #3', :privacy => Table::PRIVATE

    get_json api_tables_url do |response|
      response.status.should be_success
      response.body[:total_entries].should == 2
      response.body[:tables][1]['id'].should == table1.id
      response.body[:tables][1]['name'].should == "my_table_1"
      response.body[:tables][1]['table_size'].should == table1.table_size
      response.body[:tables][1]['tags'].split(',').should include('tag 3')
      response.body[:tables][1]['tags'].split(',').should include('tag 2')
      response.body[:tables][1]['tags'].split(',').should include('tag 1')
      response.body[:tables][1]['geometry_types'].should == []
      (response.body[:tables][1]['schema'] - default_schema).should be_empty
      response.body[:tables].map{ |t| t['name'] }.should_not include("another_table_3")
    end

    get_json api_tables_url(:page => 1, :per_page => 2) do |response|
      response.status.should be_success
      response.body[:tables].size.should == 2
      response.body[:total_entries].should == 2
    end

    get_json api_tables_url(:page => 1, :per_page => 2, :q => "2") do |response|
      response.status.should be_success
      response.body[:tables].size.should == 1
      response.body[:total_entries].should == 1
      response.body[:tables][0]['name'].should == "my_table_2"
    end

    get_json api_tables_url(:page => 1, :per_page => 10, :q => "tesTing") do |response|
      response.status.should be_success
      response.body[:tables].size.should == 1
      response.body[:tables][0]['name'].should == "my_table_1"
    end
  end

  it "Should update metadata of orphans tables created via SQL API" do
    @user.in_database.run(
      <<-SQL
        CREATE TABLE my_new_ghost_table (id integer);
      SQL
    )

    get_json api_tables_url do |response|
      response.status.should be_success
      response.body[:tables].size.should == 1
      response.body[:tables][0]['name'].should == "my_new_ghost_table"
    end
  end

  it "Should remove metadata of tables destroyed via SQL API" do
    table = FactoryGirl.create(:table, :user_id => @user.id)

    get_json api_tables_url do |response|
      response.status.should be_success
      response.body[:tables].size.should == 1
      response.body[:tables][0]['name'].should == "untitled_table"
    end

    @user.in_database.run(
      <<-SQL
        DROP TABLE #{table.name};
      SQL
    )

    get_json api_tables_url do |response|
      response.status.should be_success
      response.body[:tables].size.should == 0
    end
  end

  it "Should update metadata of tables renamed via SQL API" do
    table = FactoryGirl.create(:table, :user_id => @user.id)

    get_json api_tables_url do |response|
      response.status.should be_success
      response.body[:tables].size.should == 1
      response.body[:tables][0]['name'].should == "untitled_table"
    end

    @user.in_database.run(
      <<-SQL
        ALTER TABLE #{table.name} RENAME TO ghost_table;
      SQL
    )

    get_json api_tables_url do |response|
      response.status.should be_success
      response.body[:tables].size.should == 1
      response.body[:tables][0]['name'].should == "ghost_table"
    end
  end

  it "Should update metadata of outdated tables" do
    Table.destroy
    3.times { FactoryGirl.create(:table, :user_id => @user.id) }

    Table.all.each do |table|
      table.update(:table_id => nil)
    end

    get_json api_tables_url do |response|
      response.status.should be_success
      response.body[:tables].size.should == 3
    end

    Table.exclude(:table_id => nil).count.should be == 3
  end

  scenario "Get tables from a tag" do
    another_user = create_user

    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PRIVATE, :tags => "tag 1, tag 2,tag 3, tag 3"
    table2 = create_table :user_id => @user.id, :name => 'My table #2', :privacy => Table::PRIVATE
    table3 = create_table :user_id => another_user.id, :name => 'Another table #3', :privacy => Table::PRIVATE
    table4 = create_table :user_id => @user.id, :name => 'My table #3', :privacy => Table::PRIVATE, :tags => "tag 1"

    get_json api_tables_tag_url("tag 1", :page => 1, :per_page => 10) do |response|
      response.status.should be_success
      response.body[:total_entries].should == 2
      response.body[:tables].map{ |t| t['name'] }.should == ["my_table_3", "my_table_1"]
    end

    get_json api_tables_tag_url("tag 1", :page => 1, :per_page => 1) do |response|
      response.status.should be_success
      response.body[:tables].map{ |t| t['name'] }.should == ["my_table_3"]
    end

    get_json api_tables_tag_url("tag 1", :page => 2, :per_page => 1) do |response|
      response.status.should be_success
      response.body[:tables].map{ |t| t['name'] }.should == ["my_table_1"]
    end

    get_json api_tables_tag_url("tag 2", :page => 1, :per_page => 10) do |response|
      response.status.should be_success
      response.body[:tables].map{ |t| t['name'] }.should == ["my_table_1"]
    end

    get_json api_tables_tag_url("tag 4") do |response|
      response.status.should be_success
      response.body[:tables].map{ |t| t['name'] }.should be_empty
    end
  end

  scenario "Create a new table without schema" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    post_json api_tables_url do |response|
      response.status.should be_success
      response.body[:id].should == response.headers['Location'].match(/\/(\d+)$/)[1].to_i
      response.body[:name].should match(/^untitled/)
      response.body[:schema].should =~ default_schema
    end
  end

  scenario "Create a new table specifing a name, description and a schema" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once

    post_json api_tables_url, {:name => "My new imported table", :schema => "code varchar, title varchar, did integer, date_prod timestamp, kind varchar", :description => "Testing is awesome"} do |response|
      response.status.should be_success
      response.body[:name].should == "my_new_imported_table"
      response.body[:description].should == "Testing is awesome"
      response.body[:schema].should =~ [
         ["cartodb_id", "number"], ["code", "string"], ["title", "string"], ["did", "number"],
         ["date_prod", "date"], ["kind", "string"], ["created_at", "date"], ["updated_at", "date"]
       ]
    end
  end

  scenario "Create a new table specifying a geometry of type point" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once

    post_json api_tables_url, {:name => "My new imported table", :the_geom_type => "Point" } do |response|
      response.status.should be_success
      response.body[:name].should == "my_new_imported_table"
      (response.body[:schema] - [
         ["cartodb_id", "number"], ["name", "string"], ["description", "string"],
         ["the_geom", "geometry", "geometry", "point"], ["created_at", "date"], ["updated_at", "date"]
       ]).should be_empty
    end
  end

  scenario "Create a new table specifying a geometry of type polygon" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once

    post_json api_tables_url, {:name => "My new imported table", :the_geom_type => "Polygon" } do |response|
      response.status.should be_success
      response.body[:name].should == "my_new_imported_table"
      (response.body[:schema] - [
         ["cartodb_id", "number"], ["name", "string"], ["description", "string"],
         ["the_geom", "geometry", "geometry", "multipolygon"], ["created_at", "date"], ["updated_at", "date"]
       ]).should be_empty
    end
  end

  scenario "Create a new table specifying a geometry of type line" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once

    post_json api_tables_url, {:name => "My new imported table", :the_geom_type => "Line" } do |response|
      response.status.should be_success
      response.body[:name].should == "my_new_imported_table"
      (response.body[:schema] - [
         ["cartodb_id", "number"], ["name", "string"], ["description", "string"],
         ["the_geom", "geometry", "geometry", "multilinestring"], ["created_at", "date"], ["updated_at", "date"]
       ]).should be_empty
    end
  end

  scenario "Create a new table specifying tags" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once

    post_json api_tables_url, {:name => "My new imported table", :tags => "environment,wadus" } do |response|
      response.status.should be_success
      response.body[:name].should == "my_new_imported_table"
      response.body[:tags].should include("environment")
      response.body[:tags].should include("wadus")
    end
  end

  pending "Fail nicely when you create a new table with bad schema" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    post_json api_tables_url, {:name => "My new imported table", :schema => "bla bla blat"} do |response|
      response.status.should == 400
    end
  end

  scenario "Get a table metadata information" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :tags => "tag 1, tag 2,tag 3, tag 3", :description => "Testing is awesome"

    get_json api_table_url(table1.name) do |response|
      response.status.should be_success
      response.body[:id].should == table1.id
      response.body[:name].should == "my_table_1"
      response.body[:description].should == "Testing is awesome"
      response.body[:privacy].should == "PRIVATE"
      response.body[:table_size].should == table1.table_size
      response.body[:tags].should include("tag 1")
      response.body[:tags].should include("tag 2")
      response.body[:tags].should include("tag 3")
      (response.body[:schema] - default_schema).should be_empty
    end
  end

  scenario "Update the metadata of a table" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1',  :tags => "tag 1, tag 2,tag 3, tag 3", :description => ""

    put_json api_table_url(table1.name), {:name => "my_table_2", :tags => "bars,disco", :privacy => Table::PRIVATE, :description => "Testing is awesome"} do |response|
      response.status.should be_success
      response.body[:id].should == table1.id
      response.body[:name].should == "my_table_2"
      response.body[:privacy] == "PRIVATE"
      response.body[:description].should == "Testing is awesome"
      response.body[:tags].split(',').should include("disco")
      response.body[:tags].split(',').should include("bars")
      (response.body[:schema] - default_schema).should be_empty
    end
  end

  # TODO: the API is supposed to return http 200 when the user submits invalid data?
  scenario "Update with bad values the metadata of a table" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :tags => "tag 1, tag 2,tag 3, tag 3"
    put_json api_table_url(table1.name), {:privacy => "bad privacy value"} do |response|
      response.status.should == 400
      table1.refresh
      table1.privacy.should == 0
    end

    put_json api_table_url(table1.name), {:name => ""} do |response|
      response.status.should == 400
    end

    get_json api_table_url(table1.name) do |response|
      response.status.should == 200
    end
  end

  scenario "Delete a table of mine" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once

    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PRIVATE, :tags => "tag 1, tag 2,tag 3, tag 3"

    delete_json api_table_url(table1.name) do |response|
      response.status.should == 204
    end
  end

  scenario "Delete a table of another user" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).never

    another_user = create_user
    table1 = create_table :user_id => another_user.id, :name => 'My table #1', :privacy => Table::PRIVATE, :tags => "tag 1, tag 2,tag 3, tag 3"

    delete_json api_table_url(table1.name) do |response|
      response.status.should == 404
    end
  end

  scenario "Update a table and set the lat and lot columns" do
    table = Table.new :privacy => Table::PRIVATE, :name => 'Madrid Bars',
                      :tags => 'movies, personal'
    table.user_id = @user.id
    table.force_schema = "name varchar, address varchar, latitude float, longitude float"
    table.save
    pk = table.insert_row!({:name => "Hawai", :address => "Calle de Pérez Galdós 9, Madrid, Spain", :latitude => 40.423012, :longitude => -3.699732})
    table.insert_row!({:name => "El Estocolmo", :address => "Calle de la Palma 72, Madrid, Spain", :latitude => 40.426949, :longitude => -3.708969})
    table.insert_row!({:name => "El Rey del Tallarín", :address => "Plaza Conde de Toreno 2, Madrid, Spain", :latitude => 40.424654, :longitude => -3.709570})
    table.insert_row!({:name => "El Lacón", :address => "Manuel Fernández y González 8, Madrid, Spain", :latitude => 40.415113, :longitude => -3.699871})
    table.insert_row!({:name => "El Pico", :address => "Calle Divino Pastor 12, Madrid, Spain", :latitude => 40.428198, :longitude => -3.703991})

    put_json api_table_url(table.name), {
      :latitude_column => "latitude",
      :longitude_column => "longitude"
    } do |response|
      response.status.should be_success
      response.body[:schema].should include(["the_geom", "geometry", "geometry", "point"])
    end
  end

  pending "Update a table and set the the address column" do
    table = create_table :user_id => @user.id, :name => 'My table #1'

    put_json api_table_url(table.name), {
      :address_column => "name"
    } do |response|
      response.status.should be_success
      response.body[:schema].should include(["name", "string", "address"])
    end

    put_json api_table_url(table.name), {
      :address_column => "nil"
    } do |response|
      response.status.should be_success
      response.body[:schema].should include(["name", "string"])
    end
  end

  pending "Update a table and set the the address column to an aggregated of columns" do
    table = new_table
    table.user_id = @user.id
    table.force_schema = "name varchar, address varchar, region varchar, country varchar"
    table.save

    put_json api_table_url(table.name), {
      :address_column => "address,region, country"
    } do |response|
      response.status.should be_success
      response.body[:schema].should include(["aggregated_address", "string", "address"])
    end
  end

  scenario "Download a table in shp format" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PRIVATE, :tags => "tag 1, tag 2,tag 3, tag 3"

    visit "#{api_table_url(table1.name, :format => 'shp')}"
    current_path.should be == '/api/v1/tables/my_table_1.shp'
  end

  scenario "Download a table in csv format" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PRIVATE, :tags => "tag 1, tag 2,tag 3, tag 3"
    table1.insert_row!({:name => "El Estocolmo"})
    visit "#{api_table_url(table1.name, :format => 'csv')}"
    current_path.should be == '/api/v1/tables/my_table_1.csv'
  end

  scenario "Download table metadata" do
    data_import = DataImport.create( :user_id       => @user.id,
      :table_name    => 'elecciones2008',
      :data_source   => '/../spec/support/data/TM_WORLD_BORDERS_SIMPL-0.3.zip')

    table1 = Table[data_import.table_id]
    get_json "#{api_table_url(table1.name)}" do |response|
      response.status.should be_success
      response.body.except(:updated_at, :id).should == {
        :name => "elecciones2008",
        :privacy => "PRIVATE",
        :tags => "",
        :schema =>[["cartodb_id", "number"], ["the_geom", "geometry", "geometry", "multipolygon"], ["area", "number"], ["fips", "string"], ["iso2", "string"], ["iso3", "string"], ["lat", "number"], ["lon", "number"], ["name", "string"], ["pop2005", "number"], ["region", "number"], ["subregion", "number"], ["un", "number"], ["created_at", "date"], ["updated_at", "date"]],
        :rows_counted => 246,
        :table_size => 356352,
        :map_id => table1.map.id,
        :description => nil,
        :geometry_types => ["ST_MultiPolygon"]
      }
    end
  end

  scenario "save a infowindow for a table" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PRIVATE, :tags => "tag 1, tag 2,tag 3, tag 3"
    post_json api_tables_info_window_url(table1.id), {:infowindow => "id, desc, name"} do |response|
      response.status.should == 200
    end
  end

  scenario "save a map_metadata for a table" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PRIVATE, :tags => "tag 1, tag 2,tag 3, tag 3"
    post_json api_tables_map_metadata_url(table1.id), {:map_metadata => "some_metadata"} do |response|
      response.status.should == 200
    end
  end

end
