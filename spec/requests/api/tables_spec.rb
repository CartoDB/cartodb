#encoding: UTF-8
require_relative '../../acceptance_helper'
require_relative '../../spec_helper'

describe "Tables API" do

  before(:all) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
    @another_user = create_user
  end

  before(:each) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    delete_user_data @user
    host! 'test.localhost.lan'
    @headers = { 
      'CONTENT_TYPE'  => 'application/json',
      'HTTP_HOST'     => 'test.localhost.lan'
    }
  end

  let(:params) { { :api_key => @user.api_key } }

  describe 'GET /api/v1/tables' do
    it 'returns ordered results based on query params' do
      table1  = create_table(name: 'bogus_table_1', user_id: @user.id)
      table2  = create_table(name: 'bogus_table_2', user_id: @user.id)
      order_params = Addressable::URI.new
      order_params.query_values = { o: { name: 'asc' } }

      get "/api/v1/tables?api_key=#{@user.api_key}&#{order_params.query}",
        {}, @headers

      last_response.status.should == 200
    end
  end # GET /api/v1/tables

  describe 'GET /api/v1/tables/:id' do
    it 'returns table attributes' do
      table = create_table(
        user_id:      @user.id,
        name:         'My table #1',
        privacy:      Table::PRIVATE,
        tags:         "tag 1, tag 2,tag 3, tag 3",
        description:  'Testing is awesome'
      )

      get "/api/v1/tables/#{table.id}?api_key=#{@user.api_key}",
        {}, @headers

      last_response.status.should == 200
      response = JSON.parse(last_response.body)
      response.fetch('visualization_ids').should_not be_empty
    end
  end # GET /api/v1/tables/:id

  context "when having 0 tables" do
    it "returns an empty table list" do
      get_json v1_tables_url(params) do |response|
        response.status.should be_success
        response.body.should == { total_entries: 0, tables: [] }
      end
    end
  end

  context "when having some tables" do
    before(:each) do
      @table1 = create_table user_id: @user.id,         name: 'My table #1', privacy: Table::PRIVATE, tags: "tag 1, tag 2,tag 3, tag 3", description: 'Testing is awesome'
      @table2 = create_table user_id: @user.id,         name: 'My table #2', privacy: Table::PRIVATE
      @table3 = create_table user_id: @another_user.id, name: 'Another table #3', privacy: Table::PRIVATE
      @table4 = create_table user_id: @user.id,         name: 'My table #3', privacy: Table::PRIVATE, tags: "tag 1"
    end

    it "gets current user tables" do
      get_json v1_tables_url(params) do |response|
        response.status.should be_success
        response.body[:total_entries].should == 3
        response.body[:tables].map { |t| t['id'] }.should =~ [@table1.id, @table2.id, @table4.id]
        response.body[:tables][0]["name"].should == "my_table_1"
        response.body[:tables][0].keys.should =~ ["id", "name", "privacy", "tags", "updated_at", "rows_counted", "table_size", "map_id", "description"]
      end
    end

    it "honors specified page and per_page params" do
      get_json v1_tables_url(params.merge(page: 1, per_page: 2)) do |response|
        response.status.should be_success
        response.body[:tables].size.should == 2
      end
    end

    it "finds tables by name" do
      get_json v1_tables_url(params.merge(page: 1, per_page: 2, q: "2")) do |response|
        response.status.should be_success
        response.body[:tables].size.should == 1
        response.body[:total_entries].should == 1
        response.body[:tables][0]['name'].should == "my_table_2"
      end
    end

    it "finds tables by description (case insensitive)" do
      get_json v1_tables_url(params.merge(page: 1, per_page: 10, q: "tesTing")) do |response|
        response.status.should be_success
        response.body[:tables].size.should == 1
        response.body[:tables][0]['name'].should == "my_table_1"
      end
    end

    it "finds tables by tag name" do
      pending 'Moved to visualization'
      get_json show_tag_v1_tables_url("tag 1", params.merge(page: 1, per_page: 10)) do |response|
        response.status.should be_success
        response.body[:total_entries].should == 2
        response.body[:tables].map{ |t| t['name'] }.should include("my_table_3", "my_table_1")
      end
    end

    it "finds tables by tag name, honoring page and per_page" do
      pending 'Moved to visualization'
      get_json show_tag_v1_tables_url("tag 1", params.merge(:page => 1, :per_page => 1)) do |response|
        response.status.should be_success
        response.body[:tables].map{ |t| t['name'] }.should == ["my_table_3"]
      end

      get_json show_tag_v1_tables_url("tag 1", params.merge(:page => 2, :per_page => 1)) do |response|
        response.status.should be_success
        response.body[:tables].map{ |t| t['name'] }.should == ["my_table_1"]
      end

      get_json show_tag_v1_tables_url("tag 2", params.merge(:page => 1, :per_page => 10)) do |response|
        response.status.should be_success
        response.body[:tables].map{ |t| t['name'] }.should == ["my_table_1"]
      end

      get_json show_tag_v1_tables_url("tag 4", params) do |response|
        response.status.should be_success
        response.body[:tables].map{ |t| t['name'] }.should be_empty
      end
    end
  end

  pending "updates metadata of orphans tables created via SQL API" do
    @user.in_database.run(
      <<-SQL
        CREATE TABLE my_new_ghost_table (id integer);
      SQL
    )

    get_json v1_tables_url(params) do |response|
      response.status.should be_success
      response.body[:tables].size.should == 1
      response.body[:tables][0]['name'].should == "my_new_ghost_table"
    end
  end

  it "removes metadata of tables destroyed via SQL API" do
    FactoryGirl.create(:table, :user_id => @user.id)
    table = FactoryGirl.create(:table, :user_id => @user.id)

    @user.in_database.drop_table table.name

    get_json v1_tables_url(params) do |response|
      response.status.should be_success
      response.body[:tables].size.should == 1
      response.body[:tables][0]["name"].should_not == table.name
    end
  end

  pending "updates metadata of tables renamed via SQL API" do
    table = FactoryGirl.create(:table, :user_id => @user.id)

    get_json v1_tables_url(params) do |response|
      response.status.should be_success
      response.body[:tables].size.should == 1
      response.body[:tables][0]['name'].should == "untitled_table"
    end

    @user.in_database.run(
      <<-SQL
        ALTER TABLE #{table.name} RENAME TO ghost_table;
      SQL
    )

    get_json v1_tables_url(params) do |response|
      response.status.should be_success
      response.body[:tables].size.should == 1
      response.body[:tables][0]['name'].should == "ghost_table"
    end
  end

  it "updates metadata of outdated tables" do
    Table.destroy
    3.times { FactoryGirl.create(:table, :user_id => @user.id) }

    Table.all.each do |table|
      table.update(:table_id => nil)
    end

    get_json v1_tables_url(params) do |response|
      response.status.should be_success
      response.body[:tables].size.should == 3
    end

    Table.exclude(:table_id => nil).count.should be == 3
  end

  it "creates a new table without schema" do
    post_json v1_tables_url(params) do |response|
      response.status.should be_success
      response.body[:id].should == response.headers['Location'].match(/\/(\d+)$/)[1].to_i
      response.body[:name].should match(/^untitled/)
      response.body[:schema].should =~ default_schema
    end
  end

  it "creates a new table without schema when a table of the same name exists on the database" do
    @user.in_database.run "CREATE TABLE untitled_table (wadus INTEGER)"
    post_json v1_tables_url(params)

    @user.tables.count.should == 2
  end

  it "creates a new table specifing a name, description and a schema" do
    post_json v1_tables_url(params.merge(
      name: "My new imported table", 
      schema: "code varchar, title varchar, did integer, date_prod timestamp, kind varchar", 
      description: "Testing is awesome")) do |response|
      response.status.should be_success
      response.body[:name].should == "my_new_imported_table"
      response.body[:description].should == "Testing is awesome"
      response.body[:schema].should =~ [
         ["cartodb_id", "number"], ["code", "string"], ["title", "string"], ["did", "number"],
         ["date_prod", "date"], ["kind", "string"], ["created_at", "date"], ["updated_at", "date"]
       ]
    end
  end

  it "creates a new table specifying a geometry of type point" do
    post_json v1_tables_url(params.merge(name: "My new imported table", the_geom_type: "Point")) do |response|
      response.status.should be_success
      response.body[:name].should == "my_new_imported_table"
      (response.body[:schema] - [
         ["cartodb_id", "number"], ["name", "string"], ["description", "string"],
         ["the_geom", "geometry", "geometry", "point"], ["created_at", "date"], ["updated_at", "date"]
       ]).should be_empty
    end
  end

  it "creates a new table specifying a geometry of type polygon" do
    post_json v1_tables_url(params.merge(name: "My new imported table", the_geom_type: "Polygon")) do |response|
      response.status.should be_success
      response.body[:name].should == "my_new_imported_table"
      (response.body[:schema] - [
         ["cartodb_id", "number"], ["name", "string"], ["description", "string"],
         ["the_geom", "geometry", "geometry", "multipolygon"], ["created_at", "date"], ["updated_at", "date"]
       ]).should be_empty
    end
  end

  it "creates a new table specifying a geometry of type line" do
    post_json v1_tables_url(params.merge(name: "My new imported table", the_geom_type: "Line")) do |response|
      response.status.should be_success
      response.body[:name].should == "my_new_imported_table"
      (response.body[:schema] - [
         ["cartodb_id", "number"], ["name", "string"], ["description", "string"],
         ["the_geom", "geometry", "geometry", "multilinestring"], ["created_at", "date"], ["updated_at", "date"]
       ]).should be_empty
    end
  end

  it "creates a new table specifying tags" do
    pending 'Moved to visualization' 

    post_json v1_tables_url(params.merge(name: "My new imported table", tags: "environment,wadus")) do |response|
      response.status.should be_success
      response.body[:name].should == "my_new_imported_table"
      response.body[:tags].should include("environment")
      response.body[:tags].should include("wadus")
    end
  end

  pending "Fail nicely when you create a new table with bad schema" do
    post_json v1_tables_url(params.merge(name: "My new imported table", schema: "bla bla blat")) do |response|
      response.status.should == 400
    end
  end

  it "gets table metadata information" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :tags => "tag 1, tag 2,tag 3, tag 3", :description => "Testing is awesome"

    get_json v1_table_url(table1.name, params) do |response|
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

  it "updates the metadata of an existing table" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1',  :tags => "tag 1, tag 2,tag 3, tag 3", :description => ""

    put_json v1_table_url(table1.name, params.merge(
        name: "my_table_2", 
        tags: "bars,disco", 
        privacy: Table::PRIVATE, 
        description: "Testing is awesome")) do |response|
      response.status.should be_success
      response.body[:id].should == table1.id
      response.body[:name].should == "my_table_2"
      response.body[:privacy] == "PRIVATE"
      response.body[:description].should == "Testing is awesome"
      (response.body[:schema] - default_schema).should be_empty
    end
  end

  # TODO: the API is supposed to return http 200 when the user submits invalid data?
  it "updates with bad values the metadata of an existing table" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :tags => "tag 1, tag 2,tag 3, tag 3"
    put_json v1_table_url(table1.name, params.merge(privacy: "bad privacy value")) do |response|
      table1.reload.privacy.should == 0
    end

    put_json v1_table_url(table1.name, params.merge(name: "")) do |response|
      response.status.should == 200
    end

    get_json v1_table_url(table1.name, params) do |response|
      response.status.should == 200
    end
  end

  it "deletes a table of the user currently logged in" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PRIVATE, :tags => "tag 1, tag 2,tag 3, tag 3"

    delete_json v1_table_url(table1.name, params) do |response|
      response.status.should == 204
    end
  end

  it "doesn't delete a table of another user" do
    another_user = create_user
    table1 = create_table :user_id => another_user.id, :name => 'My table #1', :privacy => Table::PRIVATE, :tags => "tag 1, tag 2,tag 3, tag 3"

    delete_json v1_table_url(table1.name, params) do |response|
      response.status.should == 404
    end
  end

  it "updates a table and sets the lat and long columns" do
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

    put_json v1_table_url(table.name, params.merge(
      :latitude_column => "latitude",
      :longitude_column => "longitude"
    )) do |response|
      response.status.should be_success
      response.body[:schema].should include(["the_geom", "geometry", "geometry", "point"])
    end
  end

  pending "updates a table and sets the the address column" do
    table = create_table :user_id => @user.id, :name => 'My table #1'

    put_json v1_table_url(table.name, params.merge(
      :address_column => "name"
    )) do |response|
      response.status.should be_success
      response.body[:schema].should include(["name", "string", "address"])
    end

    put_json v1_table_url(table.name, params(
      :address_column => "nil"
    )) do |response|
      response.status.should be_success
      response.body[:schema].should include(["name", "string"])
    end
  end

  pending "updates a table and set the the address column to an aggregated of columns" do
    table = new_table
    table.user_id = @user.id
    table.force_schema = "name varchar, address varchar, region varchar, country varchar"
    table.save

    put_json v1_table_url(table.name, params.merge(address_column: "address,region, country")) do |response|
      response.status.should be_success
      response.body[:schema].should include(["aggregated_address", "string", "address"])
    end
  end

  it "downloads table metadata" do
    data_import = DataImport.create(
      user_id: @user.id,
      table_name: 'elecciones2008',
      data_source: '/../spec/support/data/TM_WORLD_BORDERS_SIMPL-0.3.zip'
    ).run_import!

    table1 = Table[data_import.table_id]
    get_json v1_table_url(table1.name, params) do |response|
      response.status.should be_success
      response.body.except(:updated_at, :id).should == {
        name: "elecciones2008",
        privacy: "PRIVATE",
        tags: "",
        schema: [["cartodb_id", "number"], ["the_geom", "geometry", "geometry", "multipolygon"], ["area", "number"], ["fips", "string"], ["iso2", "string"], ["iso3", "string"], ["lat", "number"], ["lon", "number"], ["name", "string"], ["pop2005", "number"], ["region", "number"], ["subregion", "number"], ["un", "number"], ["created_at", "date"], ["updated_at", "date"]],
        rows_counted: 246,
        table_size: 356352,
        map_id: table1.map.id,
        description: nil,
        geometry_types: ["ST_MultiPolygon"]
      }
    end
  end

end
