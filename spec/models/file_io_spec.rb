# coding: UTF-8

require 'spec_helper'

describe "FileIO" do
  context "import tables from files" do
    context "preimport tests" do
      it "rename a table to a name that exists should add a _2 to the new name" do
        user = create_user
        table = new_table :name => 'empty_file', :user_id => user.id
        table.save.reload
        table.name.should == 'empty_file'
  
        table2 = new_table :name => 'empty_file', :user_id => user.id
        table2.save.reload
        table2.name.should == 'empty_file_2'
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
      
      it "should get a valid name when a table when a name containing the current name exists" do
        user = create_user
        user.table_quota = 100
        user.save
        
        table = create_table :name => 'Table #20', :user_id => user.id
        table2 = create_table :name => 'Table #2', :user_id => user.id
        table2.reload
        table2.name.should == 'table_2'
    
        table3 = create_table :name => nil, :user_id => user.id
        table4 = create_table :name => nil, :user_id => user.id
        table5 = create_table :name => nil, :user_id => user.id
        table6 = create_table :name => nil, :user_id => user.id
      end
      
      it "should allow creating multiple tables with the same name by adding a number at the and and incrementing it" do
        user = create_user
        user.table_quota = 100
        user.save
        table = create_table :name => 'Wadus The Table', :user_id => user.id
        table.name.should == "wadus_the_table"
    
        # Renaming starts at 2
        2.upto(25) do |n|
          table = create_table :name => 'Wadus The Table', :user_id => user.id
          table.name.should == "wadus_the_table_#{n}"
        end
      end
      
    end
    
    context "csv standard tests" do
      it "should import file twitters.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/twitters.csv"
        table.save.reload
        table.name.should match(/^twitters/)
        table.rows_counted.should == 7

        check_schema(table, [
          [:cartodb_id, "integer"], [:url, "text"], [:login, "text"], 
          [:country, "text"], [:followers_count, "text"], [:field_5, "text"], 
          [:created_at, "timestamp without time zone"], [:updated_at, "timestamp without time zone"],
          [:the_geom, "geometry", "geometry", "point"]
        ])
        row = table.records[:rows][0]
        row[:url].should == "http://twitter.com/vzlaturistica/statuses/23424668752936961"
        row[:login].should == "vzlaturistica "
        row[:country].should == " Venezuela "
        row[:followers_count].should == "211"
      end
      
      it "should import ngoaidmap_projects.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/ngoaidmap_projects.csv"
        table.save
        table.reload
        table.name.should == 'ngoaidmap_projects'
        table.rows_counted.should == 1864
      end
      
      it "should import and then export file twitters.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/twitters.csv"
        table.save.reload
        table.name.should match(/^twitters/)
        table.rows_counted.should == 7
    
        # write CSV to tempfile and read it back
        csv_content = nil
        zip = table.to_csv
        file = Tempfile.new('zip')
        File.open(file,'w+') { |f| f.write(zip) }
    
        Zip::ZipFile.foreach(file) do |entry|
          entry.name.should == "twitters_export.csv"
          csv_content = entry.get_input_stream.read
        end
        file.close
    
        # parse constructed CSV and test
        parsed = CSV.parse(csv_content)
        parsed[0].should == ["cartodb_id", "country", "field_5", "followers_count", "login", "url", "created_at", "updated_at", "the_geom"]
        parsed[1].first.should == "1"
      end

      it "should import file import_csv_1.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/import_csv_1.csv"
        table.save
        table.reload
        table.name.should == 'import_csv_1'

        table.rows_counted.should == 100
        row = table.records[:rows][6]
        row[:cartodb_id] == 6
        row[:id].should == "6"
        row[:name_of_species].should == "Laetmonice producta 6"
        row[:kingdom].should == "Animalia"
        row[:family].should == "Aphroditidae"
        row[:lat].should == "0.2"
        row[:lon].should == "2.8"
        row[:views].should == "540"
      end

      it "should import file import_csv_2.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/import_csv_2.csv"
        table.save
        table.reload
        table.name.should == 'import_csv_2'

        table.rows_counted.should == 100
        row = table.records[:rows][6]
        row[:cartodb_id] == 6
        row[:id].should == "6"
        row[:name_of_species].should == "Laetmonice producta 6"
        row[:kingdom].should == "Animalia"
        row[:family].should == "Aphroditidae"
        row[:lat].should == "0.2"
        row[:lon].should == "2.8"
        row[:views].should == "540"
      end
  
      it "should import file flights-bad-encoding.csv" do
        table = new_table
        table.import_from_file = "#{Rails.root}/db/fake_data/flights-bad-encoding.csv"
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
        table.rows_counted.should == 1998
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

      it "should import estaciones.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/estaciones.csv"
        table.save
        table.reload
        table.name.should == 'estaciones'
        table.rows_counted.should == 30
      end
  
      it "should import estaciones2.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/estaciones2.csv"
        table.save
        table.reload
        table.name.should == 'estaciones2'
        table.rows_counted.should == 30
      end

      it "should import CSV file csv_no_quotes.csv" do
        user = create_user
        table = new_table :name => nil, :user_id => user.id
        table.import_from_file = "#{Rails.root}/db/fake_data/csv_no_quotes.csv"
        table.save.reload
    
        table.name.should == 'csv_no_quotes'
        table.rows_counted.should == 8406    
      end
  
      it "should import a CSV file with a the_geom column in GeoJSON format" do
        user = create_user
        table = new_table
        table.user_id = user.id
        table.import_from_file = "#{Rails.root}/db/fake_data/cp_vizzuality_export.csv"
        table.save
        
        table.rows_counted.should == 19235
      end  
    end
    
    context "xls standard tests" do
      it "should import file ngos.xlsx" do
        user = create_user
        table = new_table :name => nil
        table.user_id = user.id
        table.import_from_file = "#{Rails.root}/db/fake_data/ngos.xlsx"
        table.save
        table.reload
        table.name.should == 'ngos'

        check_schema(table, [
          [:cartodb_id, "integer"], [:organization, "text"], [:website, "text"], [:about, "text"],
          [:organization_s_work_in_haiti, "text"], [:calculation_of_number_of_people_reached, "text"],
          [:private_funding, "text"], [:relief, "text"], [:reconstruction, "text"],
          [:private_funding_spent, "text"], [:spent_on_relief, "text"], [:spent_on_reconstruction, "text"],
          [:usg_funding, "text"], [:usg_funding_spent, "text"], [:other_funding, "text"], [:other_funding_spent, "text"],
          [:international_staff, "text"], [:national_staff, "text"], [:us_contact_name, "text"], [:us_contact_title, "text"],
          [:us_contact_phone, "text"], [:us_contact_e_mail, "text"], [:media_contact_name, "text"],
          [:media_contact_title, "text"], [:media_contact_phone, "text"], [:media_contact_e_mail, "text"],
          [:donation_phone_number, "text"], [:donation_address_line_1, "text"], [:address_line_2, "text"],
          [:city, "text"], [:state, "text"], [:zip_code, "text"], [:donation_website, "text"], 
          [:created_at, "timestamp without time zone"], [:updated_at, "timestamp without time zone"],
          [:the_geom, "geometry", "geometry", "point"]
        ])
        table.rows_counted.should == 76
      end
    end
    
    
    context "shp standard tests" do
      it "should import EjemploVizzuality.zip" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/EjemploVizzuality.zip"
        table.importing_encoding = 'LATIN1'
        table.save

        table.rows_counted.should == 11
        table.name.should == "vizzuality"
      end
  
      it "should import SHP1.zip" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/SHP1.zip"
        #table.importing_encoding = 'LATIN1'
        table.save
    
        table.name.should == "esp_adm1"
      end
    end
    
    
    context "osm standard tests" do
      it "should import guinea.osm.bz2" do
        table = new_table :name => nil
        #table.import_from_file = "#{Rails.root}/db/fake_data/EjemploVizzuality.zip"
        table.import_from_file = "#{Rails.root}/db/fake_data/guinea.osm.bz2"
        table.save
        table.rows_counted.should == 308
        table.name.should == "vizzuality"
      end
    end
    
    context "import exceptions tests" do
      it "should import reserved_names.csv" do
        user = create_user
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/reserved_names.csv"
        table.save.reload
    
        table.name.should == 'reserved_names'
        table.rows_counted.should == 2
      end
      
      it "should import a CSV file with a column named cartodb_id" do
        user = create_user
        table = new_table :user_id => user.id
        table.import_from_file = "#{Rails.root}/db/fake_data/gadm4_export.csv"
        table.save.reload
        check_schema(table, [
          [:cartodb_id, "number"], [:id_0, "string"], [:iso, "string"], 
          [:name_0, "string"], [:id_1, "string"], [:name_1, "string"], [:id_2, "string"], 
          [:name_2, "string"], [:id_3, "string"], [:name_3, "string"], [:id_4, "string"], 
          [:name_4, "string"], [:varname_4, "string"], [:type_4, "string"], [:engtype_4, "string"], 
          [:validfr_4, "string"], [:validto_4, "string"], [:remarks_4, "string"], [:shape_leng, "string"], 
          [:shape_area, "string"], [:latitude, "string"], [:longitude, "string"], [:center_latitude, "string"], 
          [:the_geom, "geometry", "geometry", "point"], [:center_longitude, "string"], 
          [:created_at, "date"], [:updated_at, "date"]
        ], :cartodb_types => true)
      end
    end
    
    context "post import processing tests" do
      it "should add a point the_geom column after importing a CSV" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/twitters.csv"
        table.save.reload
        table.name.should match(/^twitters/)
        table.rows_counted.should == 7
        check_schema(table, [
          [:cartodb_id, "integer"], [:url, "text"], [:login, "text"], 
          [:country, "text"], [:followers_count, "text"], [:field_5, "text"], 
          [:created_at, "timestamp without time zone"], [:updated_at, "timestamp without time zone"], [:the_geom, "geometry", "geometry", "point"]
        ])
    
        row = table.records[:rows][0]
        row[:url].should == "http://twitter.com/vzlaturistica/statuses/23424668752936961"
        row[:login].should == "vzlaturistica "
        row[:country].should == " Venezuela "
        row[:followers_count].should == "211"
      end

      it "should not drop a table that exists when upload fails" do
        user = create_user
        table = new_table :name => 'empty_file', :user_id => user.id
        table.save.reload
        table.name.should == 'empty_file'
    
        table2 = new_table :name => nil, :user_id => user.id
        table2.import_from_file = "#{Rails.root}/db/fake_data/empty_file.csv"
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
        table2.import_from_file = "#{Rails.root}/db/fake_data/csv_no_quotes.csv"
        table2.save.reload
        table2.name.should == 'csv_no_quotes'
    
        user.in_database do |user_database|
          user_database.table_exists?(table.name.to_sym).should be_true
          user_database.table_exists?(table2.name.to_sym).should be_true
        end
      end
  
      # Not supported by cartodb-importer v0.2.1
      pending "should escape reserved column names" do
        user = create_user
        table = new_table :user_id => user.id
        table.import_from_file = "#{Rails.root}/db/fake_data/reserved_columns.csv"
        table.save.reload
    
        table.schema.should include([:_xmin, "number"])
      end
      
      it "should add a cartodb_id serial column as primary key when importing a file without a column with name cartodb_id" do
        user = create_user
        table = new_table :user_id => user.id
        table.import_from_file = "#{Rails.root}/db/fake_data/gadm4_export.csv"
        table.save.reload
        user = User.select(:id,:database_name,:crypted_password).filter(:id => table.user_id).first
        table_schema = user.in_database.schema(table.name)
    
        cartodb_id_schema = table_schema.detect {|s| s[0].to_s == "cartodb_id"}
        cartodb_id_schema.should be_present
        cartodb_id_schema = cartodb_id_schema[1]
        cartodb_id_schema[:db_type].should == "integer"
        cartodb_id_schema[:default].should == "nextval('#{table.name}_cartodb_id_seq'::regclass)"
        cartodb_id_schema[:primary_key].should == true
        cartodb_id_schema[:allow_null].should == false
      end
  
      it "should copy cartodb_id values to a new cartodb_id serial column when importing a file which already has a cartodb_id column" do
        user = create_user
        table = new_table :user_id => user.id
        table.import_from_file = "#{Rails.root}/db/fake_data/with_cartodb_id.csv"
        table.save.reload
    
        check_schema(table, [
          [:cartodb_id, "number"], [:name, "string"], [:the_geom, "geometry", "geometry", "point"], 
          [:invalid_the_geom, "string"], [:created_at, "date"], [:updated_at, "date"]
        ], :cartodb_types => true)
    
        user = User.select(:id,:database_name,:crypted_password).filter(:id => table.user_id).first
        table_schema = user.in_database.schema(table.name)
        cartodb_id_schema = table_schema.detect {|s| s[0].to_s == "cartodb_id"}
        cartodb_id_schema.should be_present
        cartodb_id_schema = cartodb_id_schema[1]
        cartodb_id_schema[:db_type].should == "integer"
        cartodb_id_schema[:default].should == "nextval('#{table.name}_cartodb_id_seq'::regclass)"
        cartodb_id_schema[:primary_key].should == true
        cartodb_id_schema[:allow_null].should == false
    
        # CSV has this data:
        # 3,Row 3,2011-08-29 16:18:37.114106,2011-08-29 16:19:07.61527,
        # 5,Row 5,2011-08-29 16:18:37.114106,2011-08-29 16:19:16.216058,
        # 7,Row 7,2011-08-29 16:18:37.114106,2011-08-29 16:19:31.380103,
    
        # cartodb_id values should be preserved
        rows = table.records(:order_by => "cartodb_id", :mode => "asc")[:rows]
        rows.size.should == 3
        rows[0][:cartodb_id].should == 3
        rows[0][:name].should == "Row 3"
        rows[1][:cartodb_id].should == 5
        rows[1][:name].should == "Row 5"
        rows[2][:cartodb_id].should == 7
        rows[2][:name].should == "Row 7"
    
        table.insert_row!(:name => "Row 8")
        rows = table.records(:order_by => "cartodb_id", :mode => "asc")[:rows]
        rows.size.should == 4
        rows.last[:cartodb_id].should == 8
        rows.last[:name].should == "Row 8"
      end
  
      it "should make sure it converts created_at and updated at to date types when importing from CSV" do
        user = create_user
        table = new_table :user_id => user.id
        table.import_from_file = "#{Rails.root}/db/fake_data/gadm4_export.csv"
        table.save.reload
        schema = table.schema(:cartodb_types => true)
        schema.include?([:updated_at, "date"]).should == true
        schema.include?([:created_at, "date"]).should == true
      end  
      it "should normalize strings if there is a non-convertible entry when converting string to number" do
        user = create_user
        table = new_table
        table.user_id = user.id
        table.name = "elecciones2008"
        table.import_from_file = "#{Rails.root}/spec/support/data/column_string_to_number.csv"
        table.save    

        table.modify_column! :name=>"f1", :type=>"number", :old_name=>"f1", :new_name=>nil
    
        table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == 1
        table.sequel.select(:f1).where(:test_id => '2').first[:f1].should == 2
        table.sequel.select(:f1).where(:test_id => '3').first[:f1].should == nil
        table.sequel.select(:f1).where(:test_id => '4').first[:f1].should == 1234
        table.sequel.select(:f1).where(:test_id => '5').first[:f1].should == 45345
        table.sequel.select(:f1).where(:test_id => '6').first[:f1].should == -41234
        table.sequel.select(:f1).where(:test_id => '7').first[:f1].should == 21234.2134
        table.sequel.select(:f1).where(:test_id => '8').first[:f1].should == 2345.2345
        table.sequel.select(:f1).where(:test_id => '9').first[:f1].should == -1234.3452
        table.sequel.select(:f1).where(:test_id => '10').first[:f1].should == nil
        table.sequel.select(:f1).where(:test_id => '11').first[:f1].should == nil
        table.sequel.select(:f1).where(:test_id => '12').first[:f1].should == nil                                
      end
  
      it "should normalize string if there is a non-convertible entry when converting string to boolean" do
        user = create_user
        table = new_table
        table.user_id = user.id
        table.name = "my_precious"
        table.import_from_file = "#{Rails.root}/spec/support/data/column_string_to_boolean.csv"
        table.save    
    
        # configure nil column
        table.sequel.where(:test_id => '11').update(:f1 => nil)                              
    
        # configure blank column
        table.sequel.insert(:test_id => '12', :f1 => "")                              
    
        # update datatype
        table.modify_column! :name=>"f1", :type=>"boolean", :old_name=>"f1", :new_name=>nil
    
        # test
        table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == true
        table.sequel.select(:f1).where(:test_id => '2').first[:f1].should == true
        table.sequel.select(:f1).where(:test_id => '3').first[:f1].should == true
        table.sequel.select(:f1).where(:test_id => '4').first[:f1].should == true
        table.sequel.select(:f1).where(:test_id => '5').first[:f1].should == true
        table.sequel.select(:f1).where(:test_id => '6').first[:f1].should == true
        table.sequel.select(:f1).where(:test_id => '7').first[:f1].should == true
        table.sequel.select(:f1).where(:test_id => '8').first[:f1].should == false
        table.sequel.select(:f1).where(:test_id => '9').first[:f1].should == false
        table.sequel.select(:f1).where(:test_id => '10').first[:f1].should == false
        table.sequel.select(:f1).where(:test_id => '11').first[:f1].should == nil
        table.sequel.select(:f1).where(:test_id => '12').first[:f1].should == nil    
      end
  
      it "should normalize boolean if there is a non-convertible entry when converting boolean to string" do
        user = create_user
        table = new_table
        table.user_id = user.id
        table.name = "my_precious"
        table.import_from_file = "#{Rails.root}/spec/support/data/column_boolean_to_string.csv"
        table.save    
        table.modify_column! :name=>"f1", :type=>"boolean", :old_name=>"f1", :new_name=>nil    
        table.modify_column! :name=>"f1", :type=>"string", :old_name=>"f1", :new_name=>nil
    
        table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == 'true'                              
        table.sequel.select(:f1).where(:test_id => '2').first[:f1].should == 'false'                              
      end

      it "should normalize boolean if there is a non-convertible entry when converting boolean to number" do
        user = create_user
        table = new_table
        table.user_id = user.id
        table.name = "my_precious"
        table.import_from_file = "#{Rails.root}/spec/support/data/column_boolean_to_string.csv"
        table.save    
        table.modify_column! :name=>"f1", :type=>"boolean", :old_name=>"f1", :new_name=>nil    
        table.modify_column! :name=>"f1", :type=>"number", :old_name=>"f1", :new_name=>nil
    
        table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == 1                              
        table.sequel.select(:f1).where(:test_id => '2').first[:f1].should == 0                              
      end
  
      it "should normalize number if there is a non-convertible entry when converting number to string" do
        user = create_user
        table = new_table
        table.user_id = user.id
        table.name = "my_precious"
        table.import_from_file = "#{Rails.root}/spec/support/data/column_number_to_string.csv"
        table.save    
        table.modify_column! :name=>"f1", :type=>"number", :old_name=>"f1", :new_name=>nil    
        table.modify_column! :name=>"f1", :type=>"string", :old_name=>"f1", :new_name=>nil
    
        table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == '1'                              
        table.sequel.select(:f1).where(:test_id => '2').first[:f1].should == '2'                              
      end
  
      it "should normalize number if there is a non-convertible entry when converting number to boolean" do
        user = create_user
        table = new_table
        table.user_id = user.id
        table.name = "my_precious"
        table.import_from_file = "#{Rails.root}/spec/support/data/column_number_to_boolean.csv"
        table.save    
        table.modify_column! :name=>"f1", :type=>"number", :old_name=>"f1", :new_name=>nil    
        table.modify_column! :name=>"f1", :type=>"boolean", :old_name=>"f1", :new_name=>nil
    
        table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == true                              
        table.sequel.select(:f1).where(:test_id => '2').first[:f1].should == false                              
        table.sequel.select(:f1).where(:test_id => '3').first[:f1].should == true                              
        table.sequel.select(:f1).where(:test_id => '4').first[:f1].should == true                                  
      end
    end
  end
  
  context "migrate existing postgresql tables into cartodb" do
    it "create table via SQL statement and then migrate table into CartoDB" do
      table = new_table :name => nil
      table.migrate_existing_table = "exttable"
      user = User[table.user_id]
      user.run_pg_query("CREATE TABLE exttable (go VARCHAR, ttoo INT, bed VARCHAR)")
      user.run_pg_query("INSERT INTO exttable (go, ttoo, bed) VALUES ( 'c', 1, 'p');
                         INSERT INTO exttable (go, ttoo, bed) VALUES ( 'c', 2, 'p')")
      table.save
      table.name.should == 'exttable'
      table.rows_counted.should == 2
    end
    
    it "create and migrate a table containing a the_geom and cartodb_id" do
      table = new_table :name => nil
      table.migrate_existing_table = "exttable"
      user = User[table.user_id]
      user.run_pg_query("CREATE TABLE exttable (the_geom VARCHAR, cartodb_id INT, bed VARCHAR)")
      user.run_pg_query("INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( 'c', 1, 'p');
                         INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( 'c', 2, 'p')")
      table.save
      table.name.should == 'exttable'
      table.rows_counted.should == 2
    end
    
    it "create and migrate a table containing a valid the_geom" do
      table = new_table :name => nil
      table.migrate_existing_table = "exttable"
      user = User[table.user_id]
      user.run_pg_query("CREATE TABLE exttable (cartodb_id INT, bed VARCHAR)")
      user.run_pg_query("SELECT AddGeometryColumn ('exttable','the_geom',4326,'POINT',2);")
      user.run_pg_query("INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( GEOMETRYFROMTEXT('POINT(10 14)',4326), 1, 'p');
                         INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( GEOMETRYFROMTEXT('POINT(22 34)',4326), 2, 'p')")
      table.save
      table.name.should == 'exttable'
      table.rows_counted.should == 2
      check_schema(table, [[:cartodb_id, "integer"], [:bed, "text"], [:created_at, "timestamp without time zone"], [:updated_at, "timestamp without time zone"], [:the_geom, "geometry", "geometry", "point"]])
    end
  end
  
  context "merging two+ tables" do
    it "should merge two twitters.csv" do
      # load a table to treat as our 'existing' table
      table = new_table  :name => nil
      table.import_from_file = "#{Rails.root}/db/fake_data/twitters.csv" 
      table.save.reload
      #create a second table from a file to treat as the data we want to append
      append_this = new_table  :name => nil
      append_this.user_id = table.user_id
      append_this.import_from_file = "#{Rails.root}/db/fake_data/clubbing.csv" 
      append_this.save.reload
      # envoke the append_to_table method
      table.append_to_table(:from_table => append_this)
      table.save.reload
      # append_to_table doesn't automatically destroy the table
      append_this.destroy
    
      Table[append_this.id].should == nil
      table.name.should match(/^twitters/)
      table.rows_counted.should == 2005
    end
  
    it "should import and then export file twitters.csv" do
      table = new_table :name => nil
      table.import_from_file = "#{Rails.root}/db/fake_data/twitters.csv"
      table.save.reload
      table.name.should match(/^twitters/)
      table.rows_counted.should == 7
    
      # write CSV to tempfile and read it back
      csv_content = nil
      zip = table.to_csv
      file = Tempfile.new('zip')
      File.open(file,'w+') { |f| f.write(zip) }
    
      Zip::ZipFile.foreach(file) do |entry|
        entry.name.should == "twitters_export.csv"
        csv_content = entry.get_input_stream.read
      end
      file.close
    
      # parse constructed CSV and test
      parsed = CSV.parse(csv_content)
      parsed[0].should == ["cartodb_id", "country", "field_5", "followers_count", "login", "url", "created_at", "updated_at", "the_geom"]
      parsed[1].first.should == "1"
    end
  
    it "should import and then export file SHP1.zip" do
      table = new_table :name => nil
      table.import_from_file = "#{Rails.root}/db/fake_data/SHP1.zip"
      table.importing_encoding = 'LATIN1'
      table.save

      table.name.should == "esp_adm1"
    
      # write CSV to tempfile and read it back
      shp_content = nil
      zip = table.to_shp
      file_ct = 0
      file = Tempfile.new('zip')
      File.open(file,'w+') { |f| f.write(zip) }
      Zip::ZipFile.foreach(file) do |entry|
        file_ct = file_ct + 1
      end
      file.close
      file_ct.should == 4
    end
  
    it "should import and then export file SHP1.zip as kml" do
      table = new_table :name => nil
      table.import_from_file = "#{Rails.root}/db/fake_data/SHP1.zip"
      table.importing_encoding = 'LATIN1'
      table.save
      table.name.should == "esp_adm1"
    
      # write CSV to tempfile and read it back
      shp_content = nil
      zip = table.to_kml
      file_ct = 0
      file = Tempfile.new('zip')
      File.open(file,'w+') { |f| f.write(zip) }
      Zip::ZipFile.foreach(file) do |entry|
        file_ct = file_ct + 1
      end
      file.close
      file_ct.should == 1
    end
    
    it "should import and then export file SHP1.zip as sql" do
      table = new_table :name => nil
      table.import_from_file = "#{Rails.root}/db/fake_data/SHP1.zip"
      table.importing_encoding = 'LATIN1'
      table.save

      table.name.should == "esp_adm1"
    
      # write SQL to tempfile and read it back
      shp_content = nil
      zip = table.to_sql
      file_ct = 0
      file = Tempfile.new('zip')
      File.open(file,'w+') { |f| f.write(zip) }
      Zip::ZipFile.foreach(file) do |entry|
        file_ct = file_ct + 1
      end
      file.close
      file_ct.should == 1
    end
  end
  
  context "exporting tables" do
    it "should return the content of the table in CSV format" do
      # build up a new table
      user               = create_user
      table              = Table.new :privacy => Table::PRIVATE, :tags => 'movies, personal'
      table.user_id      = user.id
      table.name         = 'Madrid Bars'
      table.force_schema = "name varchar, address varchar, latitude float, longitude float"
      table.save
      table.insert_row!({:name      => "Hawai", 
                         :address   => "Calle de Pérez Galdós 9, Madrid, Spain", 
                         :latitude  => 40.423012, 
                         :longitude => -3.699732})
                       
      table.georeference_from!(:latitude_column  => :latitude, 
                               :longitude_column => :longitude)

      # write CSV to tempfile and read it back
      csv_content = nil
      zip = table.to_csv
      file = Tempfile.new('zip')
      File.open(file,'w+') { |f| f.write(zip) }
    
      Zip::ZipFile.foreach(file) do |entry|
        entry.name.should == "madrid_bars_export.csv"
        csv_content = entry.get_input_stream.read
      end
      file.close
    
      # parse constructed CSV and test
      parsed = CSV.parse(csv_content)
      parsed[0].should == ["cartodb_id", "address", "latitude", "longitude", "name", "updated_at", "created_at", "the_geom"]
      parsed[1].first.should == "1"
      parsed[1].last.should  ==  "{\"type\":\"Point\",\"coordinates\":[-3.699732,40.423012]}"
    end
  
    it "should return the content of a brand new table in SHP format" do
      table = create_table :name => 'table1'
      table.insert_row!({:name => "name #1", :description => "description #1"})
    
      zip = table.to_shp
      path = "/tmp/temp_shp.zip"
      fd = File.open(path,'w+')
      fd.write(zip)
      fd.close
      Zip::ZipFile.foreach(path) do |entry|
        %W{ table1_export.shx table1_export.shp table1_export.dbf table1_export.prj }.should include(entry.name)
      end
      FileUtils.rm_rf(path)
    end
  
    it "should return the content of a populated table in SHP format" do
      user = create_user
      table = new_table
      table.import_from_file = "#{Rails.root}/db/fake_data/import_csv_1.csv"
      table.user_id = user.id
      table.name = "import_csv_1"
      table.save
    
      # FIXME: At some point georeferencing an imported table won't be necessary here
      table.georeference_from!(:latitude_column => "lat", :longitude_column => "lon")
    
      zip = table.to_shp
      path = "/tmp/temp_shp.zip"
      fd = File.open(path,'w+')
      fd.write(zip)
      fd.close
      Zip::ZipFile.foreach(path) do |entry|
        %W{ import_csv_1_export.shx import_csv_1_export.shp import_csv_1_export.dbf import_csv_1_export.prj }.should include(entry.name)
      end
      FileUtils.rm_rf(path)
    end
  end
  
end