# coding: UTF-8

require 'spec_helper'

describe Table do

  it "should have a name and a user_id" do
    table = Table.new
    table.should_not be_valid
    table.errors.on(:user_id).should_not be_nil
    table.name.should == "untitle_table"
  end

  it "should set a default name different than the previous" do
    user = create_user
    table = Table.new
    table.user_id = user.id
    table.save
    table.name.should == "untitle_table"

    table2 = Table.new
    table2.user_id = user.id
    table2.save.reload
    table2.name.should == "untitle_table_2"
  end

  it "should have a privacy associated and it should be private by default" do
    table = create_table
    table.privacy.should_not be_nil
    table.should be_private
  end

  it "should be associated to a database table" do
    user = create_user
    table = create_table :name => 'Wadus table', :user_id => user.id
    Rails::Sequel.connection.table_exists?(table.name.to_sym).should be_false
    user.in_database do |user_database|
      user_database.table_exists?(table.name.to_sym).should be_true
    end
  end

  it "should rename a database table when the attribute name is modified" do
    user = create_user
    table = create_table :name => 'Wadus table', :user_id => user.id
    Rails::Sequel.connection.table_exists?(table.name.to_sym).should be_false
    user.in_database do |user_database|
      user_database.table_exists?(table.name.to_sym).should be_true
    end
    table.name = 'Wadus table #2'
    table.save
    user.in_database do |user_database|
      user_database.table_exists?('wadus_table'.to_sym).should be_false
      user_database.table_exists?('wadus_table_2'.to_sym).should be_true
    end
  end

  it "has a default schema" do
    table = create_table
    table.reload
    table.stored_schema.should == ["cartodb_id,integer,number","name,text,string","description,text,string", "the_geom,geometry,geometry,point", "created_at,timestamp,date","updated_at,timestamp,date"]
    table.schema(:cartodb_types => false).should be_equal_to_default_db_schema
    table.schema.should be_equal_to_default_cartodb_schema
  end
  
  it "can be associated to many tags" do
    user = create_user
    table = create_table :user_id => user.id, :tags => "tag 1, tag 2,tag 3, tag 3"
    Tag.count.should == 3
    tag1 = Tag[:name => 'tag 1']
    tag1.table_id.should == table.id
    tag1.user_id.should == user.id
    tag2 = Tag[:name => 'tag 2']
    tag2.user_id.should == user.id
    tag2.table_id.should == table.id
    tag3 = Tag[:name => 'tag 3']
    tag3.user_id.should == user.id
    tag3.table_id.should == table.id

    table.tags = "tag 1"
    table.save_changes
    Tag.count.should == 1
    tag1 = Tag[:name => 'tag 1']
    tag1.table_id.should == table.id
    tag1.user_id.should == user.id

    table.tags = "    "
    table.save_changes
    Tag.count.should == 0
  end

  it "can add a column of a CartoDB::TYPE type" do
    table = create_table
    table.schema(:cartodb_types => false).should be_equal_to_default_db_schema

    resp = table.add_column!(:name => "my new column", :type => "number")
    resp.should == {:name => "my_new_column", :type => "smallint", :cartodb_type => "number"}
    table.reload
    table.schema(:cartodb_types => false).should include([:my_new_column, "smallint"])
  end

  it "can modify a column using a CartoDB::TYPE type" do
    table = create_table
    resp = table.modify_column!(:name => "name", :type => "number")
    resp.should == {:name => "name", :type => "smallint", :cartodb_type => "number"}
  end
  
  it "should not modify the name of a column to a number" do
    table = create_table
    lambda {
      table.modify_column!(:old_name => "name", :new_name => "1")
    }.should raise_error(CartoDB::InvalidColumnName)
  end

  it "can modify it's schema" do
    table = create_table
    table.schema(:cartodb_types => false).should be_equal_to_default_db_schema

    lambda {
      table.add_column!(:name => "my column with bad type", :type => "textttt")
    }.should raise_error(CartoDB::InvalidType)

    resp = table.add_column!(:name => "my new column", :type => "integer")
    resp.should == {:name => 'my_new_column', :type => 'integer', :cartodb_type => 'number'}
    table.reload
    table.schema(:cartodb_types => false).should include([:my_new_column, "integer"])

    resp = table.modify_column!(:old_name => "my_new_column", :new_name => "my new column new name", :type => "text")
    resp.should == {:name => 'my_new_column_new_name', :type => 'text', :cartodb_type => 'string'}
    table.reload
    table.schema(:cartodb_types => false).should include([:my_new_column_new_name, "text"])

    resp = table.modify_column!(:old_name => "my_new_column_new_name", :new_name => "my new column")
    resp.should == {:name => 'my_new_column', :type => "text", :cartodb_type => "string"}
    table.reload
    table.schema(:cartodb_types => false).should include([:my_new_column, "text"])

    resp = table.modify_column!(:name => "my_new_column", :type => "text")
    resp.should == {:name => 'my_new_column', :type => 'text', :cartodb_type => 'string'}
    table.reload
    table.schema(:cartodb_types => false).should include([:my_new_column, "text"])

    table.drop_column!(:name => "description")
    table.reload
    table.schema(:cartodb_types => false).should_not include([:description, "text"]) 

    lambda {
      table.drop_column!(:name => "description")
    }.should raise_error
  end

  it "cannot modify :cartodb_id column" do
    table = create_table
    original_schema = table.schema(:cartodb_types => false)

    lambda {
      table.modify_column!(:old_name => "cartodb_id", :new_name => "new_id", :type => "integer")
    }.should raise_error
    table.reload
    table.schema(:cartodb_types => false).should == original_schema

    lambda {
      table.modify_column!(:old_name => "cartodb_id", :new_name => "cartodb_id", :type => "float")
    }.should raise_error
    table.reload
    table.schema(:cartodb_types => false).should == original_schema

    lambda {
      table.drop_column!(:name => "cartodb_id")
    }.should raise_error
    table.reload
    table.schema(:cartodb_types => false).should == original_schema
  end

  it "should be able to modify it's schema with castings that the DB engine doesn't support" do
    table = create_table
    table.add_column!(:name => "my new column", :type => "text")
    table.reload
    table.schema(:cartodb_types => false).should include([:my_new_column, "text"])

    pk = table.insert_row!(:name => "Text", :my_new_column => "1")
    table.modify_column!(:old_name => "my_new_column", :new_name => "my new column new name", :type => "integer", :force_value => "NULL")
    table.reload
    table.schema(:cartodb_types => false).should include([:my_new_column_new_name, "integer"])

    rows = table.records
    rows[:rows][0][:my_new_column_new_name].should == 1
  end

  it "should be able to insert a new row" do
    table = create_table
    table.rows_counted.should == 0
    primary_key = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})
    table.reload
    table.rows_counted.should == 1
    primary_key.should == table.records(:rows_per_page => 1)[:rows].first[:cartodb_id]

    lambda {
      table.insert_row!({})
    }.should_not raise_error(CartoDB::EmtpyAttributes)

    lambda {
      table.insert_row!({:non_existing => "bad value"})
    }.should raise_error(CartoDB::InvalidAttributes)
  end

  it "should be able to insert a row with a geometry value" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.save
    table.reload

    lat = Float.random_latitude
    lon = Float.random_longitude
    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    pk = table.insert_row!({:name => "First check_in", :the_geom => the_geom})

    query_result = user.run_query("select ST_X(the_geom) as lon, ST_Y(the_geom) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
  end

  it "should be able to update a row" do
    table = create_table
    pk = table.insert_row!({:name => String.random(10), :description => ""})
    table.update_row!(pk, :description => "Description 123")

    row = table.records(:rows_per_page => 1, :page => 0)[:rows].first
    row[:description].should == "Description 123"

    lambda {
      table.update_row!(pk, :non_existing => 'ignore it, please', :description => "Description 123")
    }.should raise_error(CartoDB::InvalidAttributes)
  end

  it "should be able to update a row with a geometry value" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.save
    table.reload

    lat = Float.random_latitude
    lon = Float.random_longitude
    pk = table.insert_row!({:name => "First check_in"})

    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    table.update_row!(pk, {:the_geom => the_geom})

    query_result = user.run_query("select ST_X(the_geom) as lon, ST_Y(the_geom) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
  end

  it "should increase the tables_count counter from owner" do
    user = create_user
    user.tables_count.should == 0

    table = create_table :user_id => user.id
    user.reload
    user.tables_count.should == 1
  end

  it "should remove and updating the denormalized counters when removed" do
    user = create_user
    table = create_table :user_id => user.id, :tags => 'tag 1, tag2'

    table.destroy
    user.reload
    user.tables_count.should == 0
    Tag.count.should == 0
    Table.count == 0
    user.in_database{|database| database.table_exists?(table.name).should be_false}
    table.constraints.count.should == 0
  end

  it "can be created with a given schema if it is valid" do
    table = new_table
    table.force_schema = "code char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
    table.save
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:code, "character(5)"], [:title, "character varying(40)"], 
      [:did, "integer"], [:date_prod, "date"], [:kind, "character varying(10)"], 
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
  end

  it "should sanitize columns from a given schema" do
    table = new_table
    table.force_schema = "\"code wadus\" char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
    table.save
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:code_wadus, "character(5)"], [:title, "character varying(40)"], 
      [:did, "integer"], [:date_prod, "date"], [:kind, "character varying(10)"],
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
  end

  it "should import a CSV if the schema is given and is valid" do
    table = new_table
    table.force_schema = "url varchar(255) not null, login varchar(255), country varchar(255), \"followers count\" integer, foo varchar(255)"
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table.save

    table.rows_counted.should == 7
    row0 = table.records[:rows][0]
    row0[:cartodb_id].should == 1
    row0[:url].should == "http://twitter.com/vzlaturistica/statuses/23424668752936961"
    row0[:login].should == "vzlaturistica "
    row0[:country].should == " Venezuela "
    row0[:followers_count].should == 211
  end

  it "should be able to insert rows in a table imported from a CSV file" do
    table = new_table
    table.force_schema = "url varchar(255) not null, login varchar(255), country varchar(255), \"followers count\" integer, foo varchar(255)"
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table.save

    lambda {
      pk = table.insert_row!({:url => 'http://twitter.com/ferblape/statuses/1231231', :login => 'ferblape', :country => 'Spain', :followers_count => 33})
      pk.should_not be_nil
    }.should_not raise_error
  end

  it "should guess the schema from import file import_csv_1.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_1.csv", "text/csv")
    table.force_schema.should be_blank
    table.guess_schema
    table.force_schema.should == "id integer, name_of_species varchar, kingdom varchar, family varchar, lat float, lon float, views integer"
  end

  it "should guess the schema from import file import_csv_2.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_2.csv", "text/csv")
    table.force_schema.should be_blank
    table.guess_schema
    table.force_schema.should == "id integer, name_of_specie varchar, kingdom varchar, family varchar, lat float, lon float, views integer"
  end

  it "should guess the schema from import file import_csv_3.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_3.csv", "text/csv")
    table.force_schema.should be_blank
    table.guess_schema
    table.force_schema.should == "id integer, name_of_specie varchar, kingdom varchar, family varchar, lat float, lon float, views integer"
  end

  it "should guess the schema from import file twitters.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table.force_schema.should be_blank
    table.guess_schema
    table.force_schema.should == "url varchar, login varchar, country varchar, followers_count integer, unknow_name_1 varchar"
  end

  it "should import file twitters.csv" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table.save
    table.reload

    table.rows_counted.should == 7
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:url, "character varying"], [:login, "character varying"], 
      [:country, "character varying"], [:followers_count, "integer"], [:unknow_name_1, "character varying"], 
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
    row = table.records[:rows][0]
    row[:url].should == "http://twitter.com/vzlaturistica/statuses/23424668752936961"
    row[:login].should == "vzlaturistica "
    row[:country].should == " Venezuela "
    row[:followers_count].should == 211
  end

  it "should import file import_csv_1.csv" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_1.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.records[:rows][6]
    row[:cartodb_id] == 6
    row[:id].should == 6
    row[:name_of_species].should == "Laetmonice producta 6"
    row[:kingdom].should == "Animalia"
    row[:family].should == "Aphroditidae"
    row[:lat].should == 0.2
    row[:lon].should == 2.8
    row[:views].should == 540
  end

  it "should import file import_csv_2.csv" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_2.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.records[:rows][6]
    row[:id].should == 6
    row[:name_of_specie].should == "Laetmonice producta 6"
    row[:kingdom].should == "Animalia"
    row[:family].should == "Aphroditidae"
    row[:lat].should == 0.2
    row[:lon].should == 2.8
    row[:views].should == 540
  end

  it "should import file import_csv_3.csv" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_3.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.records[:rows][6]
    row[:id].should == 6
    row[:name_of_specie].should == "Laetmonice producta 6"
    row[:kingdom].should == "Animalia"
    row[:family].should == "Aphroditidae"
    row[:lat].should == 0.2
    row[:lon].should == 2.8
    row[:views].should == 540
  end

  it "should import file import_csv_4.csv" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_4.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.records[:rows][6]
    row[:id].should == 6
    row[:name_of_specie].should == "Laetmonice producta 6"
    row[:kingdom].should == "Animalia"
    row[:family].should == "Aphroditidae"
    row[:lat].should == 0.2
    row[:lon].should == 2.8
    row[:views].should == 540
  end

  it "should import file ngos.xlsx" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/ngos.xlsx", "application/download")
    table.save

    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:organization, "character varying"], [:website, "character varying"], [:about, "character varying"],
      [:organization_s_work_in_haiti, "character varying"], [:calculation_of_number_of_people_reached, "character varying"],
      [:private_funding, "double precision"], [:relief, "character varying"], [:reconstruction, "character varying"],
      [:private_funding_spent, "double precision"], [:spent_on_relief, "character varying"], [:spent_on_reconstruction, "character varying"],
      [:usg_funding, "integer"], [:usg_funding_spent, "integer"], [:other_funding, "integer"], [:other_funding_spent, "integer"],
      [:international_staff, "integer"], [:national_staff, "integer"], [:us_contact_name, "character varying"], [:us_contact_title, "character varying"],
      [:us_contact_phone, "character varying"], [:us_contact_e_mail, "character varying"], [:media_contact_name, "character varying"],
      [:media_contact_title, "character varying"], [:media_contact_phone, "character varying"], [:media_contact_e_mail, "character varying"],
      [:donation_phone_number, "character varying"], [:donation_address_line_1, "character varying"], [:address_line_2, "character varying"],
      [:city, "character varying"], [:state, "character varying"], [:zip_code, "integer"], [:donation_website, "character varying"], 
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
    table.rows_counted.should == 76
  end
  
  it "should raise an error if importing a SHP file without indicating an SRID" do
    lambda {
      table = new_table
      table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/EjemploVizzuality.zip", "application/download")
      table.save
    }.should raise_error(CartoDB::InvalidSRID)
  end
  
  it "should import EjemploVizzuality.zip" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/EjemploVizzuality.zip", "application/download")
    table.importing_SRID = CartoDB::SRID
    table.importing_encoding = 'LATIN1'
    table.save

    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:gid, "integer"], [:subclass, "character varying(255)"], [:x, "double precision"], [:y, "double precision"], 
      [:length, "character varying(255)"], [:area, "character varying(255)"], [:angle, "double precision"], [:name, "character varying(255)"], 
      [:pid, "double precision"], [:lot_navteq, "character varying(255)"], [:version_na, "character varying(255)"], [:vitesse_sp, "double precision"], 
      [:id, "double precision"], [:nombrerest, "character varying(255)"], [:tipocomida, "character varying(255)"], 
      [:the_geom, "geometry", "geometry", "multipolygon"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
    table.rows_counted.should == 11
    table.name.should == "vizzuality_shp"
  end

  it "should import data from an external url returning JSON data" do
    json = JSON.parse(File.read("#{Rails.root}/spec/support/bus_gijon.json"))
    JSON.stubs(:parse).returns(json)
    table = new_table
    table.import_from_external_url = "http://externaldata.com/bus_gijon.json"
    table.save

    table.rows_counted.should == 7
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:idautobus, "integer"], [:utmx, "integer"],
      [:utmy, "integer"], [:horaactualizacion, "character varying"], [:fechaactualizacion, "character varying"],
      [:idtrayecto, "integer"], [:idparada, "integer"], [:minutos, "integer"], [:distancia, "double precision"],
      [:idlinea, "integer"], [:matricula, "character varying"], [:modelo, "character varying"],
      [:ordenparada, "integer"], [:idsiguienteparada, "integer"], 
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
    row = table.records[:rows][0]
    row[:cartodb_id].should == 1
    row[:idautobus].should == 330
    row[:horaactualizacion].should == "14:23:10"
    row[:idparada] == 34
  end

  it "should alter the schema automatically to a a wide range of numbers when inserting" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, age integer"
    table.save

    pk_row1 = table.insert_row!(:name => 'Fernando Blat', :age => "29")
    table.rows_counted.should == 1

    pk_row2 = table.insert_row!(:name => 'Javi Jam', :age => "25.4")
    table.rows_counted.should == 2

    table.schema(:cartodb_types => false).should include([:age, "real"])
    table.schema.should include([:age, "number"])
  end

  it "should alter the schema automatically to a a wide range of numbers when updating" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, age integer"
    table.save

    pk_row1 = table.insert_row!(:name => 'Fernando Blat', :age => "29")
    table.rows_counted.should == 1

    pk_row2 = table.update_row!(pk_row1, :name => 'Javi Jam', :age => "25.4")
    table.rows_counted.should == 1

    table.schema(:cartodb_types => false).should include([:age, "real"])
    table.schema.should include([:age, "number"])
  end

  it "should be able to store a polygon" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar, the_geom geometry"
    table.the_geom_type = "polygon"
    table.save

    the_geom = %Q{\{"type":"Polygon","coordinates":[[[-4.976720809936523,40.56963630849391],[-4.735021591186523,40.87977970146914],[-4.507055282592773,40.53624641730805]]]\}}

    pk = table.insert_row!({:address => "C/ Pilar Martí nº 16 pta 13, Burjassot, Valencia", :the_geom => the_geom})
    query_result = user.run_query("SELECT ST_NPoints(the_geom) from #{table.name} where cartodb_id = #{pk}");
    query_result[:rows][0][:st_npoints].should == 4
  end
  
  it "should rename the pk sequence when renaming the table" do
    user = create_user
    table1 = new_table :name => 'table 1'
    table1.user_id = user.id
    table1.save
    
    table1.name = 'table 2'
    table1.save
    
    table2 = new_table :name => 'table 1'
    table2.user_id = user.id
    table2.save

    lambda {
      table2.destroy
    }.should_not raise_error
  end
  
  it "should create a the_geom_webmercator column with the_geom projected to 3785" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.save
    table.reload

    lat = Float.random_latitude
    lon = Float.random_longitude
    pk = table.insert_row!({:name => "First check_in"})

    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    table.update_row!(pk, {:the_geom => the_geom})

    query_result = user.run_query("select ST_X(ST_TRANSFORM(the_geom_webmercator,4326)) as lon, ST_Y(ST_TRANSFORM(the_geom_webmercator,4326)) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
  end
  
  it "should create a the_geom_webmercator column with the_geom projected to 3785 even when schema is forced" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, the_geom geometry"
    table.save
    table.reload

    lat = Float.random_latitude
    lon = Float.random_longitude
    pk = table.insert_row!({:name => "First check_in"})

    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    table.update_row!(pk, {:the_geom => the_geom})

    query_result = user.run_query("select ST_X(ST_TRANSFORM(the_geom_webmercator,4326)) as lon, ST_Y(ST_TRANSFORM(the_geom_webmercator,4326)) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
  end
  
  it "should return a geojson for the_geom if it is a point" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.save
    table.reload

    lat = Float.random_latitude
    lon = Float.random_longitude
    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    pk = table.insert_row!({:name => "First check_in", :the_geom => the_geom})

    records = table.records(:page => 0, :rows_per_page => 1)
    RGeo::GeoJSON.decode(records[:rows][0][:the_geom], :json_parser => :json).as_text.should == "Point(#{"%.3f" % lon} #{"%.3f" % lat})"
    
    record = table.record(pk)
    RGeo::GeoJSON.decode(record[:the_geom], :json_parser => :json).as_text.should == "Point(#{"%.3f" % lon} #{"%.3f" % lat})"
  end
  
  it "should return a kml for the_geom if it is a point" do
    
  end
end
