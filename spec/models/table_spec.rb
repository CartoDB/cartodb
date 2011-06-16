# coding: UTF-8

require 'spec_helper'

describe Table do

  it "should set a default name different than the previous" do
    user = create_user
    table = Table.new
    table.user_id = user.id
    table.save.reload
    table.name.should == "untitle_table"

    table2 = Table.new
    table2.user_id = user.id
    table2.save.reload
    table2.name.should == "untitle_table_2"
  end

  it "should have a privacy associated and it should be private by default" do
    table = create_table
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
    table.name = 'Wadus table #23'
    table.save
    table.reload
    table.name.should == "Wadus table #23".sanitize
    user.in_database do |user_database|
      user_database.table_exists?('wadus_table'.to_sym).should be_false
      user_database.table_exists?('wadus_table_23'.to_sym).should be_true
    end
  end
  
  it "should have a unique key to be identified in Redis" do
    table = create_table
    user = User[table.user_id]
    table.key.should == "rails:#{table.database_name}:#{table.oid}"
  end
  
  it "should rename the entries in Redis when the table has been renamed" do
    table = create_table
    user = User[table.user_id]
    table.name = "brand_new_name"
    table.save_changes
    table.reload
    table.key.should == "rails:#{table.database_name}:#{table.oid}"
    $tables_metadata.exists(table.key).should be_true
  end
  
  it "should store the identifier of its owner when created" do
    table = create_table
    $tables_metadata.hget(table.key,"user_id").should == table.user_id.to_s
  end
  
  it "should store the_geom_type in Redis" do
    table = create_table
    table.the_geom_type.should == "point"
    $tables_metadata.hget(table.key,"the_geom_type").should == "point"
    
    table.the_geom_type = "multipolygon"
    $tables_metadata.hget(table.key,"the_geom_type").should == "multipolygon"
  end
  
  it "should remove the table from Redis when removing the table" do
    table = create_table
    $tables_metadata.exists(table.key).should be_true
    table.destroy
    $tables_metadata.exists(table.key).should be_false
  end

  it "has a default schema" do
    table = create_table
    table.reload
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
    resp.should == {:name => "my_new_column", :type => "double precision", :cartodb_type => "number"}
    table.reload
    table.schema(:cartodb_types => false).should include([:my_new_column, "double precision"])
  end

  it "can modify a column using a CartoDB::TYPE type" do
    table = create_table
    resp = table.modify_column!(:name => "name", :type => "number")
    resp.should == {:name => "name", :type => "double precision", :cartodb_type => "number"}
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
    }.should_not raise_error(CartoDB::EmptyAttributes)

    lambda {
      table.insert_row!({:non_existing => "bad value"})
    }.should raise_error(CartoDB::InvalidAttributes)
  end

  it "should be able to insert a row with a geometry value" do
    user = create_user
    table = new_table :user_id => user.id
    table.save.reload

    lat = -43.941
    lon = 3.429
    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    pk = table.insert_row!({:name => "First check_in", :the_geom => the_geom})

    query_result = user.run_query("select ST_X(the_geom) as lon, ST_Y(the_geom) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
  end
  
  it "should update null value to nil when inserting and updating" do
    user = create_user
    table = new_table :user_id => user.id
    table.force_schema = "valid boolean"
    table.save.reload
    pk = table.insert_row!({:valid => "null"})
    table.record(pk)[:valid].should be_nil
    
    pk = table.insert_row!({:valid => true})
    table.update_row!(pk, {:valid => "null"})
    table.record(pk)[:valid].should be_nil    
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
    table = new_table :user_id => user.id
    table.save.reload

    lat = -43.941
    lon = 3.429
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
    (table.schema(:cartodb_types => false) - [
      [:updated_at, "timestamp without time zone"], [:created_at, "timestamp without time zone"], [:cartodb_id, "integer"], 
      [:code, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"], 
      [:kind, "character varying(10)"]
    ]).should be_empty
  end

  it "should sanitize columns from a given schema" do
    table = new_table
    table.force_schema = "\"code wadus\" char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
    table.save
    (table.schema(:cartodb_types => false) - [
      [:updated_at, "timestamp without time zone"], [:created_at, "timestamp without time zone"], [:cartodb_id, "integer"], 
      [:code_wadus, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"], 
      [:kind, "character varying(10)"]
    ]).should be_empty
  end

  it "should import file twitters.csv" do
    table = new_table :name => nil
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table.save.reload
    table.name.should == 'twitters'
    table.rows_counted.should == 7    
    (table.schema(:cartodb_types => false) - [
      [:cartodb_id, "integer"], [:url, "character varying"], [:login, "character varying"], 
      [:country, "character varying"], [:followers_count, "integer"], [:unknow_name_1, "character varying"], 
      [:created_at, "timestamp without time zone"], [:updated_at, "timestamp without time zone"]
    ]).should be_empty
    row = table.records[:rows][0]
    row[:url].should == "http://twitter.com/vzlaturistica/statuses/23424668752936961"
    row[:login].should == "vzlaturistica "
    row[:country].should == " Venezuela "
    row[:followers_count].should == 211
  end

  it "should import file import_csv_1.csv" do
    table = new_table :name => nil
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_1.csv", "text/csv")
    table.save
    table.reload
    table.name.should == 'import_csv_1'

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
    table = new_table :name => nil
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_2.csv", "text/csv")
    table.save
    table.reload
    table.name.should == 'import_csv_2'

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
  
  it "should import file flights-bad-encoding.csv" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/flights-bad-encoding.csv", "text/csv")
    table.save
    
    table.rows_counted.should == 791
    row = table.record(1)
    row[:vuelo].should == "A31762"
  end
  
  it "should handle an empty file empty_file.csv" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.name = "empty_table"
    table.import_from_file = "#{Rails.root}/db/fake_data/empty_file.csv"
    lambda {
      table.save
    }.should raise_error
    
    tables = user.run_query("select relname from pg_stat_user_tables WHERE schemaname='public'")
    tables[:rows].should_not include({:relname => "empty_table"})
  end
  
  # It has strange line breaks
  it "should import file arrivals_BCN.csv" do
    table = new_table :name => nil
    table.import_from_file = "#{Rails.root}/db/fake_data/arrivals_BCN.csv"
    table.save
    table.reload
    table.name.should == 'arrivals_bcn'
    table.rows_counted.should == 3855
  end
  
  it "should import file clubbing.csv" do
    table = new_table :name => nil
    table.import_from_file = "#{Rails.root}/db/fake_data/clubbing.csv"
    table.save
    table.reload
    table.name.should == 'clubbing'
    table.rows_counted.should == 2003
  end

  it "should import file short_clubbing.csv" do
    table = new_table :name => nil
    table.import_from_file = "#{Rails.root}/db/fake_data/short_clubbing.csv"
    table.save
    table.reload
    table.name.should == 'short_clubbing'
    table.rows_counted.should == 78
  end
  
  it "should import ngos_aidmaps.csv" do
    table = new_table :name => nil
    table.import_from_file = "#{Rails.root}/db/fake_data/ngos_aidmaps.csv"
    table.save
    table.reload
    table.name.should == 'ngos_aidmaps'
    table.rows_counted.should == 85
  end

  # File in format different than UTF-8
  it "should import estaciones.csv" do
    table = new_table :name => nil
    table.import_from_file = "#{Rails.root}/db/fake_data/estaciones.csv"
    table.save
    table.reload
    table.name.should == 'estaciones'
    table.rows_counted.should == 29
  end
  
  # File in format UTF-8
  it "should import estaciones2.csv" do
    table = new_table :name => nil
    table.import_from_file = "#{Rails.root}/db/fake_data/estaciones2.csv"
    table.save
    table.reload
    table.name.should == 'estaciones2'
    table.rows_counted.should == 29
  end

  it "should import file ngos.xlsx" do
    user = create_user
    table = new_table :name => nil
    table.user_id = user.id
    table.import_from_file = "#{Rails.root}/db/fake_data/ngos.xlsx"
    table.save
    table.reload
    table.name.should == 'ngos'

    (table.schema(:cartodb_types => false) - [
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
      [:created_at, "timestamp without time zone"], [:updated_at, "timestamp without time zone"]
    ]).should be_empty
    table.rows_counted.should == 76
  end
  
  it "should import EjemploVizzuality.zip" do
    table = new_table :name => nil
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/EjemploVizzuality.zip", "application/download")
    table.importing_encoding = 'LATIN1'
    table.save

    table.rows_counted.should == 11
    table.name.should == "vizzuality_shp"
  end
  
  it "should import SHP1.zip" do
    table = new_table :name => nil
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/SHP1.zip", "application/download")
    table.importing_encoding = 'LATIN1'
    table.save

    table.name.should == "esp_adm1_shp"
  end
  
  it "should import ngoaidmap_projects.csv" do
    table = new_table :name => nil
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/ngoaidmap_projects.csv", "text/csv")
    table.save
    table.reload
    table.name.should == 'ngoaidmap_projects'
    table.rows_counted.should == 1864
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

    table.schema(:cartodb_types => false).should include([:age, "double precision"])
    table.schema.should include([:age, "number"])
  end

  it "should alter the schema automatically to a a wide range of numbers when inserting a number with 0" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, age integer"
    table.save

    pk_row1 = table.insert_row!(:name => 'Fernando Blat', :age => "29")
    table.rows_counted.should == 1

    pk_row2 = table.insert_row!(:name => 'Javi Jam', :age => "25.0")
    table.rows_counted.should == 2

    table.schema(:cartodb_types => false).should include([:age, "double precision"])
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

    table.schema(:cartodb_types => false).should include([:age, "double precision"])
    table.schema.should include([:age, "number"])
  end
  
  it "should alter the schema automatically when trying to insert a big string (greater than 200 chars)" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar(40)"
    table.save    
    
    table.schema(:cartodb_types => false).should_not include([:name, "text"])

    pk_row1 = table.insert_row!(:name => 'f'*201)
    table.rows_counted.should == 1
    
    table.reload
    table.schema(:cartodb_types => false).should include([:name, "text"])
  end
  
  it "should set valid geometry types" do
    user = create_user
    table = new_table :user_id => user.id
    table.force_schema = "address varchar, the_geom geometry"
    table.the_geom_type = "line"
    table.save.reload
    table.the_geom_type.should == "multilinestring"

    table.the_geom_type = "point"
    table.save.reload
    table.the_geom_type.should == "point"

    table.the_geom_type = "multipoint"
    table.save.reload
    table.the_geom_type.should == "multipoint"

    table.the_geom_type = "polygon"
    table.save.reload
    table.the_geom_type.should == "multipolygon"
  end

  it "should rename the pk sequence when renaming the table" do
    user = create_user
    table1 = new_table :name => 'table 1', :user_id => user.id
    table1.save.reload
    table1.name.should == 'table_1'
    
    table1.name = 'table 2'
    table1.save.reload
    table1.name.should == 'table_2'
    
    table2 = new_table :name => 'table 1', :user_id => user.id
    table2.save.reload
    table2.name.should == 'table_1'

    lambda {
      table2.destroy
    }.should_not raise_error
  end
  
  it "should create a the_geom_webmercator column with the_geom projected to 3785" do
    user = create_user
    table = new_table :user_id => user.id
    table.save.reload

    lat = -43.941
    lon = 3.429
    pk = table.insert_row!({:name => "First check_in"})

    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    table.update_row!(pk, {:the_geom => the_geom})

    query_result = user.run_query("select ST_X(ST_TRANSFORM(the_geom_webmercator,4326)) as lon, ST_Y(ST_TRANSFORM(the_geom_webmercator,4326)) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
  end
  
  it "should create a the_geom_webmercator column with the_geom projected to 3785 even when schema is forced" do
    user = create_user
    table = new_table :user_id => user.id
    table.force_schema = "name varchar, the_geom geometry"
    table.save.reload

    lat = -43.941
    lon = 3.429
    pk = table.insert_row!({:name => "First check_in"})

    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    table.update_row!(pk, {:the_geom => the_geom})

    query_result = user.run_query("select ST_X(ST_TRANSFORM(the_geom_webmercator,4326)) as lon, ST_Y(ST_TRANSFORM(the_geom_webmercator,4326)) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
  end
  
  it "should return a geojson for the_geom if it is a point" do
    user = create_user
    table = new_table :user_id => user.id
    table.save.reload

    lat = -43.941
    lon = 3.429
    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    pk = table.insert_row!({:name => "First check_in", :the_geom => the_geom})

    records = table.records(:page => 0, :rows_per_page => 1)
    RGeo::GeoJSON.decode(records[:rows][0][:the_geom], :json_parser => :json).as_text.should == "POINT (#{"%.3f" % lon} #{"%.3f" % lat})"
    
    record = table.record(pk)
    RGeo::GeoJSON.decode(record[:the_geom], :json_parser => :json).as_text.should == "POINT (#{"%.3f" % lon} #{"%.3f" % lat})"
  end
  
  it "should raise an error when the geojson provided is invalid" do
    user = create_user
    table = new_table :user_id => user.id
    table.save.reload

    lat = -43.941
    lon = 3.429
    the_geom = %Q{\{"type":""""Point","coordinates":[#{lon},#{lat}]\}}
    lambda {
      table.insert_row!({:name => "First check_in", :the_geom => the_geom})
    }.should raise_error(CartoDB::InvalidGeoJSONFormat)
  end
  
  it "should be able to set a the_geom column from a latitude column and a longitude column" do
    user = create_user
    table = Table.new :privacy => Table::PRIVATE, :tags => 'movies, personal'
    table.user_id = user.id
    table.name = 'Madrid Bars'
    table.force_schema = "name varchar, address varchar, latitude float, longitude float"
    table.save
    pk = table.insert_row!({:name => "Hawai", :address => "Calle de Pérez Galdós 9, Madrid, Spain", :latitude => 40.423012, :longitude => -3.699732})
    table.insert_row!({:name => "El Estocolmo", :address => "Calle de la Palma 72, Madrid, Spain", :latitude => 40.426949, :longitude => -3.708969})
    table.insert_row!({:name => "El Rey del Tallarín", :address => "Plaza Conde de Toreno 2, Madrid, Spain", :latitude => 40.424654, :longitude => -3.709570})
    table.insert_row!({:name => "El Lacón", :address => "Manuel Fernández y González 8, Madrid, Spain", :latitude => 40.415113, :longitude => -3.699871})
    table.insert_row!({:name => "El Pico", :address => "Calle Divino Pastor 12, Madrid, Spain", :latitude => 40.428198, :longitude => -3.703991})

    table.reload
    table.georeference_from!(:latitude_column => :latitude, :longitude_column => :longitude)
    table.reload
    (table.schema(:reload => true) - [
      [:cartodb_id, "number"], [:name, "string"], [:address, "string"],
      [:the_geom, "geometry", "geometry", "point"], [:created_at, "date"], [:updated_at, "date"]
    ]).should be_empty
    record = table.record(pk)
    RGeo::GeoJSON.decode(record[:the_geom], :json_parser => :json).as_text.should == "POINT (#{"%.6f" % -3.699732} #{"%.6f" % 40.423012})"
  end
  
  it "should store the name of its database" do
    table = create_table
    user = User[table.user_id]
    table.database_name.should == user.database_name
  end
  
  it "should import CSV file csv_no_quotes.csv" do
    user = create_user
    table = new_table :name => nil, :user_id => user.id
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/csv_no_quotes.csv", "text/csv")
    table.save.reload
    
    table.name.should == 'csv_no_quotes'
    table.rows_counted.should == 8406    
  end
  
  it "should import reserved_names.csv" do
    user = create_user
    table = new_table :name => nil
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/reserved_names.csv", "text/csv")
    table.save.reload
    
    table.name.should == 'reserved_names'
    table.rows_counted.should == 2
  end
  
  it "should overwrite given name over name of the file when importing " do
    user = create_user
    table = new_table :user_id => user.id, :name => 'wadus'
    table.import_from_file = "#{Rails.root}/db/fake_data/csv_no_quotes.csv"
    table.save.reload
    
    table.name.should == 'wadus'
    table.rows_counted.should == 8406
  end
  
  it "should not drop a table that exists when upload fails" do
    user = create_user
    table = new_table :name => 'empty_file', :user_id => user.id
    table.save.reload
    table.name.should == 'empty_file'
    
    table2 = new_table :name => nil, :user_id => user.id
    table2.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/empty_file.csv", "text/csv")
    lambda {
      table2.save
    }.should raise_error
    
    user.in_database do |user_database|
      user_database.table_exists?(table.name.to_sym).should be_true
    end
  end

  it "should not drop a table that exists when upload does not fail" do
    user = create_user
    table = new_table :name => 'empty_file', :user_id => user.id
    table.save.reload
    table.name.should == 'empty_file'
    
    table2 = new_table :name => 'empty_file', :user_id => user.id
    table2.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/csv_no_quotes.csv", "text/csv")
    table2.save.reload
    table2.name.should == 'empty_file_2'
    
    user.in_database do |user_database|
      user_database.table_exists?(table.name.to_sym).should be_true
      user_database.table_exists?(table2.name.to_sym).should be_true
    end
  end
  
  it "rename a table to a name that exists should add a _2 to the new name" do
    user = create_user
    table = new_table :name => 'empty_file', :user_id => user.id
    table.save.reload
    table.name.should == 'empty_file'
    
    table2 = new_table :name => 'empty_file', :user_id => user.id
    table2.save.reload
    table2.name.should == 'empty_file_2'
  end
  
  it "should remove the user_table even when phisical table does not exist" do
    user = create_user
    table = new_table :name => 'empty_file', :user_id => user.id
    table.save.reload
    table.name.should == 'empty_file'

    user.in_database do |user_database|
      user_database.drop_table(table.name.to_sym)
    end
    
    table.destroy
    Table[table.id].should be_nil
  end
  
  it "should escape table names starting with numbers" do
    user = create_user
    table = new_table :user_id => user.id, :name => '123_table_name'
    table.save.reload
    
    table.name.should == "table_123_table_name"

    table = new_table :user_id => user.id, :name => '_table_name'
    table.save.reload
    
    table.name.should == "table_table_name"
  end
  
  it "should escape a reserved column name when importing a file with a column with an invalid name" do
    user = create_user
    table = new_table :user_id => user.id
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/reserved_columns.csv", "text/csv")
    table.save.reload
    
    table.schema.should include([:_xmin, "number"])
  end

  it "should raise an error when creating a column with reserved name" do
    table = create_table
    lambda {
      table.add_column!(:name => "xmin", :type => "number")
    }.should raise_error(CartoDB::InvalidColumnName)
  end

  it "should raise an error when renaming a column with reserved name" do
    table = create_table
    lambda {
      table.modify_column!(:old_name => "name", :new_name => "xmin")
    }.should raise_error(CartoDB::InvalidColumnName)
  end
  
  it "should return the content of the table in CSV format" do
    table = create_table :name => 'table1'
    table.insert_row!({:name => "name #1", :description => "description #1"})
    zip = table.to_csv
    path = "/tmp/temp_csv.zip"
    fd = File.open(path,'w+')
    fd.write(zip)
    fd.close
    Zip::ZipFile.foreach(path) do |entry|
      entry.name.should == "table1_export.csv"
    end
    FileUtils.rm_rf(path)
  end

  it "should return the content of the table in SHP format" do
    table = create_table :name => 'table1'
    table.insert_row!({:name => "name #1", :description => "description #1"})
    zip = table.to_shp
    path = "/tmp/temp_shp.zip"
    fd = File.open(path,'w+')
    fd.write(zip)
    fd.close
    Zip::ZipFile.foreach(path) do |entry|
      %W{ table1_export.shp table1_export.dbf table1_export.prj }.should include(entry.name)
    end
    FileUtils.rm_rf(path)
  end
  
  it "should not import a CSV file with a column named cartodb_id" do
    user = create_user
    table = new_table :user_id => user.id
    table.import_from_file = "#{Rails.root}/db/fake_data/gadm4_export.csv"
    table.save.reload
    (table.schema -  [
      [:cartodb_id, "number"], [:gid, "number"], [:id_0, "number"], [:iso, "string"], 
      [:name_0, "string"], [:id_1, "number"], [:name_1, "string"], [:id_2, "number"], 
      [:name_2, "string"], [:id_3, "number"], [:name_3, "string"], [:id_4, "number"], 
      [:name_4, "string"], [:varname_4, "string"], [:type_4, "string"], [:engtype_4, "string"], 
      [:validfr_4, "string"], [:validto_4, "string"], [:remarks_4, "string"], [:shape_leng, "number"], 
      [:shape_area, "number"], [:latitude, "number"], [:longitude, "string"], [:center_latitude, "number"], 
      [:center_longitude, "number"], [:created_at, "string"], [:updated_at, "string"]
    ]).should be_empty
  end
  
  it "should be able to find a table by name or by identifier" do
    user = create_user
    table = new_table :user_id => user.id
    table.name = 'Fucking awesome name'
    table.save.reload
    
    Table.find_by_identifier(user.id, table.id).id.should == table.id
    Table.find_by_identifier(user.id, table.name).id.should == table.id
    lambda {
      Table.find_by_identifier(666, table.name)
    }.should raise_error
    lambda {
      Table.find_by_identifier(666, table.id)
    }.should raise_error
  end
  
end
