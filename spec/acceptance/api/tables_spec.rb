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
      r.body.should == []
    end

    another_user = create_user

    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"
    table2 = create_table :user_id => @user.id, :name => 'My table #2', :privacy => Table::PRIVATE
    table3 = create_table :user_id => another_user.id, :name => 'Another table #3', :privacy => Table::PRIVATE

    get_json api_tables_url
    parse_json(response) do |r|
      r.status.should be_success
      r.body.should include({
        "id" => table1.id,
        "name" => "my_table_1",
        "privacy" => "PUBLIC",
        "tags" => "tag 3,tag 2,tag 1",
        "schema" => default_schema
      })
      r.body.map{ |t| t['name'] }.should_not include("another_table_3")
    end
  end

  scenario "Create a new table without schema" do
    post_json api_tables_url

    parse_json(response) do |r|
      r.status.should be_success
      r.body[:id].should == response.location.match(/\/(\d+)$/)[1].to_i
      r.body[:name].should match(/^untitle/)
      r.body[:schema].should == default_schema
    end
  end

  scenario "Create a new table specifing a name and a schema" do
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

  scenario "Import a file when the schema is wrong" do
    post_json api_tables_url, {
               :name => "Twitts",
               :schema => "url varchar(255) not null, login varchar(255), country varchar(255), \"followers count\" integer",
               :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
             }
    response.status.should == 400
  end

  scenario "Create a new table specifing an schema and a file from which import data" do
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
      r.body.should == {
        :id => table1.id,
        :name => "my_table_1",
        :privacy => "PUBLIC",
        :tags => "tag 1,tag 2,tag 3",
        :schema => default_schema
      }
    end
  end

  scenario "Update the metadata of a table" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    put_json api_table_url(table1.name), {:name => "my_table_2", :tags => "bars,disco", :privacy => Table::PRIVATE}
    parse_json(response) do |r|
      r.status.should be_success
      r.body.should == {
        :id => table1.id,
        :name => "my_table_2",
        :privacy => "PRIVATE",
        :tags => "disco,bars",
        :schema => default_schema
      }
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
      r.status.should be_success
      r.body[:name].should == "untitle_table"
    end
  end

  scenario "Delete a table of mine" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    delete_json api_table_url(table1.name)
    parse_json(response) do |r|
      r.status.should be_success
    end
  end

  scenario "Delete a table of another user" do
    another_user = create_user
    table1 = create_table :user_id => another_user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    delete_json api_table_url(table1.name)
    parse_json(response) do |r|
      r.status.should == 404
    end
  end

  scenario "Update a table and set the lat and lot columns to nil" do
    table = create_table :user_id => @user.id, :name => 'My table #1'

    put_json api_table_url(table.name), {
      :latitude_column => "nil",
      :longitude_column => "nil"
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:schema].should include(["latitude", "number"])
      r.body[:schema].should include(["longitude", "number"])
    end

    put_json api_table_url(table.name), {
      :address_column => "name"
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:schema].should include(["name", "string", "address"])
    end
  end

  scenario "Update a table and set the the address column" do
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

  scenario "Update a table and set the the address column to an aggregated of columns" do
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
        ["id", "number"], ["nombrerest", "string"], ["tipocomida", "string"], ["created_at", "date"], ["updated_at", "date"]
      ]
    end    
  end
  
  scenario "Create a table, remove a table, and recreate it with the same name" do
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