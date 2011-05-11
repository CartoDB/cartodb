# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 tables management" do

  background do
    Capybara.current_driver = :rack_test
    @user = create_user
    login_as @user
  end

  scenario "Get tables" do
    get_json api_tables_url
    parse_json(response) do |r|
      r.status.should be_success
      r.body.should == {:total_entries=>0, :tables=>[]}
    end

    another_user = create_user

    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"
    table2 = create_table :user_id => @user.id, :name => 'My table #2', :privacy => Table::PRIVATE
    table3 = create_table :user_id => another_user.id, :name => 'Another table #3', :privacy => Table::PRIVATE

    get_json api_tables_url
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:total_entries].should == 2
      r.body[:tables][1]['id'].should == table1.id
      r.body[:tables][1]['name'].should == "my_table_1"
      r.body[:tables][1]['tags'].split(',').should include('tag 3')
      r.body[:tables][1]['tags'].split(',').should include('tag 2')
      r.body[:tables][1]['tags'].split(',').should include('tag 1')
      r.body[:tables][1]['schema'].should == default_schema
      r.body[:tables].map{ |t| t['name'] }.should_not include("another_table_3")
    end

    get_json api_tables_url(:page => 1, :per_page => 2)
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:tables].size.should == 2
    end
  end
  
  scenario "Get tables from a tag" do
    another_user = create_user

    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"
    table2 = create_table :user_id => @user.id, :name => 'My table #2', :privacy => Table::PRIVATE
    table3 = create_table :user_id => another_user.id, :name => 'Another table #3', :privacy => Table::PRIVATE
    table4 = create_table :user_id => @user.id, :name => 'My table #3', :privacy => Table::PUBLIC, :tags => "tag 1"

    get_json api_tables_tag_url("tag 1", :page => 1, :per_page => 10)
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:total_entries].should == 2
      r.body[:tables].map{ |t| t['name'] }.should == ["my_table_3", "my_table_1"]
    end

    get_json api_tables_tag_url("tag 1", :page => 1, :per_page => 1)
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:tables].map{ |t| t['name'] }.should == ["my_table_3"]
    end

    get_json api_tables_tag_url("tag 1", :page => 2, :per_page => 1)
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:tables].map{ |t| t['name'] }.should == ["my_table_1"]
    end
    
    get_json api_tables_tag_url("tag 2", :page => 1, :per_page => 10)
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:tables].map{ |t| t['name'] }.should == ["my_table_1"]
    end
    
    get_json api_tables_tag_url("tag 4")
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:tables].map{ |t| t['name'] }.should be_empty
    end
  end

  scenario "Create a new table without schema" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    post_json api_tables_url

    parse_json(response) do |r|
      r.status.should be_success
      r.body[:id].should == response.location.match(/\/(\d+)$/)[1].to_i
      r.body[:name].should match(/^untitle/)
      r.body[:schema].should == default_schema
    end
  end

  scenario "Create a new table specifing a name and a schema" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    post_json api_tables_url, {:name => "My new imported table", :schema => "bla bla blat"}
    parse_json(response) do |r|
      r.status.should == 400
    end

    post_json api_tables_url, {:name => "My new imported table", :schema => "code varchar, title varchar, did integer, date_prod timestamp, kind varchar"}
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:name].should == "my_new_imported_table"
      r.body[:schema].should == [
         ["cartodb_id", "number"], ["code", "string"], ["title", "string"], ["did", "number"],
         ["date_prod", "date"], ["kind", "string"], ["created_at", "date"], ["updated_at", "date"]
       ]
    end
  end
  
  scenario "Create a new table specifying a geometry of type point" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    post_json api_tables_url, {:name => "My new imported table", :the_geom_type => "Point" }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:name].should == "my_new_imported_table"
      r.body[:schema].should == [
         ["cartodb_id", "number"], ["name", "string"], ["description", "string"],
         ["the_geom", "geometry", "geometry", "point"], ["created_at", "date"], ["updated_at", "date"]
       ]
    end
  end

  scenario "Create a new table specifying a geometry of type polygon" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    post_json api_tables_url, {:name => "My new imported table", :the_geom_type => "Polygon" }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:name].should == "my_new_imported_table"
      r.body[:schema].should == [
         ["cartodb_id", "number"], ["name", "string"], ["description", "string"],
         ["the_geom", "geometry", "geometry", "multipolygon"], ["created_at", "date"], ["updated_at", "date"]
       ]
    end
  end
  
  scenario "Create a new table specifying a geometry of type line" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    post_json api_tables_url, {:name => "My new imported table", :the_geom_type => "Line" }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:name].should == "my_new_imported_table"
      r.body[:schema].should == [
         ["cartodb_id", "number"], ["name", "string"], ["description", "string"],
         ["the_geom", "geometry", "geometry", "multilinestring"], ["created_at", "date"], ["updated_at", "date"]
       ]
    end
  end

  scenario "Create a new table specifing an schema and a file from which import data" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    post_json api_tables_url, {
               :name => "Twitts",
               :schema => "url varchar(255) not null, login varchar(255), country varchar(255), \"followers count\" integer, foo varchar(255)",
               :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
              }

    response.status.should be_success
  end

  scenario "Get a table metadata information" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    get_json api_table_url(table1.name)
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:id].should == table1.id
      r.body[:name].should == "my_table_1"
      r.body[:privacy].should == "PUBLIC"
      r.body[:tags].should include("tag 1")
      r.body[:tags].should include("tag 2")
      r.body[:tags].should include("tag 3")
      r.body[:schema].should == default_schema
    end
  end

  scenario "Update the metadata of a table" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    put_json api_table_url(table1.name), {:name => "my_table_2", :tags => "bars,disco", :privacy => Table::PRIVATE}
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:id].should == table1.id
      r.body[:name].should == "my_table_2"
      r.body[:privacy] == "PRIVATE"
      r.body[:tags].split(',').should include("disco")
      r.body[:tags].split(',').should include("bars")
      r.body[:schema].should == default_schema
    end
  end

  scenario "Update with bad values the metadata of a table" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    put_json api_table_url(table1.name), {:privacy => "bad privacy value"}
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:privacy].should == "PUBLIC"
    end

    put_json api_table_url(table1.name), {:name => ""}
    parse_json(response) do |r|
      r.status.should == 400
    end
    get_json api_table_url(table1.name)
    parse_json(response) do |r|
      r.status.should be_success
    end
  end

  scenario "Delete a table of mine" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    delete_json api_table_url(table1.name)
    parse_json(response) do |r|
      r.status.should be_success
    end
  end

  scenario "Delete a table of another user" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).never
    
    another_user = create_user
    table1 = create_table :user_id => another_user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    delete_json api_table_url(table1.name)
    parse_json(response) do |r|
      r.status.should == 404
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
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:schema].should include(["the_geom", "geometry", "geometry", "point"])
    end
  end

  pending "Update a table and set the the address column" do
    table = create_table :user_id => @user.id, :name => 'My table #1'

    put_json api_table_url(table.name), {
      :address_column => "name"
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:schema].should include(["name", "string", "address"])
    end

    put_json api_table_url(table.name), {
      :address_column => "nil"
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:schema].should include(["name", "string"])
    end
  end

  pending "Update a table and set the the address column to an aggregated of columns" do
    table = new_table
    table.user_id = @user.id
    table.force_schema = "name varchar, address varchar, region varchar, country varchar"
    table.save

    put_json api_table_url(table.name), {
      :address_column => "address,region, country"
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:schema].should include(["aggregated_address", "string", "address"])
    end
  end
  
  scenario "Create a new table importing file twitters.csv" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    post_json api_tables_url, {
      :name => "My new imported table", 
      :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:name].should == "my_new_imported_table"
      r.body[:schema].should == [
        ["cartodb_id", "number"], ["url", "string"], ["login", "string"], ["country", "string"], ["followers_count", "number"], 
        ["unknow_name_1", "string"], ["created_at", "date"], ["updated_at", "date"]
       ]
    end
  end

  scenario "Create a new table importing file ngos.xlsx" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    post_json api_tables_url, {
      :name => "My new imported table", 
      :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/ngos.xlsx", "application/download")
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:name].should == "my_new_imported_table"
      r.body[:schema].should == [
        ["cartodb_id", "number"], ["organization", "string"], ["website", "string"], ["about", "string"], ["organization_s_work_in_haiti", "string"], 
        ["calculation_of_number_of_people_reached", "string"], ["private_funding", "number"], ["relief", "string"], ["reconstruction", "string"], 
        ["private_funding_spent", "number"], ["spent_on_relief", "string"], ["spent_on_reconstruction", "string"], ["usg_funding", "number"], 
        ["usg_funding_spent", "number"], ["other_funding", "number"], ["other_funding_spent", "number"], ["international_staff", "number"], ["national_staff", "number"], 
        ["us_contact_name", "string"], ["us_contact_title", "string"], ["us_contact_phone", "string"], ["us_contact_e_mail", "string"], ["media_contact_name", "string"], 
        ["media_contact_title", "string"], ["media_contact_phone", "string"], ["media_contact_e_mail", "string"], ["donation_phone_number", "string"], ["donation_address_line_1", "string"], 
        ["address_line_2", "string"], ["city", "string"], ["state", "string"], ["zip_code", "number"], ["donation_website", "string"], ["created_at", "date"], ["updated_at", "date"]
      ]
    end
  end
  
  scenario "Create a new table importing file EjemploVizzuality.zip" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    post_json api_tables_url, {
      :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/EjemploVizzuality.zip", "application/download"),
      :srid => CartoDB::SRID
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:name].should == "vizzuality_shp"
      r.body[:schema].should == [
        ["cartodb_id", "number"], ["gid", "number"], ["subclass", "string"], ["x", "number"], ["y", "number"], ["length", "string"], ["area", "string"], 
        ["angle", "number"], ["name", "string"], ["pid", "number"], ["lot_navteq", "string"], ["version_na", "string"], ["vitesse_sp", "number"], 
        ["id", "number"], ["nombrerest", "string"], ["tipocomida", "string"], 
        ["the_geom", "geometry", "geometry", "multipolygon"], ["created_at", "date"], ["updated_at", "date"]
      ]
    end    
  end
  
  scenario "Create a new table importing file shp not working.zip" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    post_json api_tables_url, {
      :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/shp not working.zip", "application/download"),
      :srid => CartoDB::SRID
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:name].should == "constru_shp"
      r.body[:schema].should == [
        ["cartodb_id", "number"], ["gid", "number"], ["mapa", "number"], ["delegacio", "number"], ["municipio", "number"], ["masa", "string"], 
        ["tipo", "string"], ["parcela", "string"], ["constru", "string"], ["coorx", "number"], ["coory", "number"], ["numsymbol", "number"], 
        ["area", "number"], ["fechaalta", "number"], ["fechabaja", "number"], ["ninterno", "number"], ["hoja", "string"], ["refcat", "string"], 
        ["the_geom", "geometry", "geometry", "multipolygon"], ["created_at", "date"], ["updated_at", "date"]
      ]
    end    
  end
  
  
  scenario "Create a table, remove a table, and recreate it with the same name" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).times(3)
    
    post_json api_tables_url, {:name => "wadus", :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")}
    parse_json(response) do |r|
      r.status.should be_success
    end       
    
    delete_json api_table_url("wadus")
    parse_json(response) do |r|
      r.status.should be_success
    end

    post_json api_tables_url, {:name => "wadus", :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")}
    parse_json(response) do |r|
      r.status.should be_success
    end    
  end
  
end