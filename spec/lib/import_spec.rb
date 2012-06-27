# coding: UTF-8

require 'spec_helper'

describe CartoDB::Importer do
  
  context "basic functionality" do
    it "should raise an error if :import_from_file option is blank" do
      lambda { 
        CartoDB::Importer.new 
      }.should raise_error("import_from_file value can't be nil")
    end
    it "should get the table name from the options" do
      importer = create_importer 'clubbing.csv', 'prefered_name'
      results, errors   = importer.import!
    
      # Assertions
      results.length.should           == 1
      results[0].name.should          == 'prefered_name'
      results[0].rows_imported.should == 1998
      results[0].import_type.should   == '.csv'
      errors.length.should            == 0
    end
    it "should remove the table from the database if an exception happens" do
      importer = create_importer 'empty.csv'
      results, errors = importer.import!
      # Assertions
      errors.length.should            == 1  
      @db.tables.should_not include(:empty)    
    end
    # TODO: Is this really the intended behaviour??
    it "should keep first imported table when importing again with same name" do
      importer = create_importer 'clubbing.csv', 'testing'
      results, errors   = importer.import!

      # initial assertion
      results[0].import_type.should == '.csv'
    
      # second creation should fail with exception
      importer = create_importer 'empty.csv', 'testing'
      res, err = importer.import!
      err.length.should == 1
  
      # Assert has first import
      @db.tables.should include(:testing)
    end
 
    it "should suggest a new table name of the format _n if the previous table exists" do
      # import twice
      importer = create_importer 'clubbing.csv', 'clubs'
      results, errors   = importer.import!
    
      # have to recreate to set up the general file harnesses
      importer = create_importer 'clubbing.csv', 'clubs'
      results, errors   = importer.import!
      
      # Assert new duplicate
      errors.length.should            == 0
      results[0].name.should          == 'clubs_1'
      results[0].rows_imported.should == 1998
      results[0].import_type.should   == '.csv'
    end
    
    it "should sanitize column names" do
      importer = create_importer 'twitters.csv', 'twitters'
      results, errors   = importer.import!
    
      # grab column names from twitters table
      columns          = @db.schema(:twitters).map{|s| s[0].to_s}    
      expected_columns = ["url", "login", "country", "followers_count"]    
    
      # Assert correct column names are added
      (expected_columns - columns).should be_empty
    end

    # Filetype specific tests 
    describe "#ZIP" do
      it "should import CSV even from a ZIP file" do
        importer = create_importer 'pino.zip'
        results,errors   = importer.import!

        # Assertions
        results[0].name.should          == 'data'
        results[0].rows_imported.should == 4
        results[0].import_type.should   == '.csv'
      end
      it "should import CSV even from a ZIP file with the given name" do
        importer = create_importer 'pino.zip', "table123"
        results, errors   = importer.import!

        # Assertions
        results[0].name.should          == 'table123'
        results[0].rows_imported.should == 4
        results[0].import_type.should   == '.csv'
      end
    end
  
    describe "#CSV" do
      it "should import a CSV file in the given database in a table named like the file" do
        importer = create_importer 'clubbing.csv', 'clubsaregood'
        results,errors = importer.import!

        results[0].name.should          == 'clubsaregood'
        results[0].rows_imported.should == 1998
        results[0].import_type.should   == '.csv'
      end
    
      it "should import estaciones2.csv" do
        importer = create_importer 'estaciones2.csv'
        results,errors = importer.import!

        results[0].name.should          == 'estaciones2'
        results[0].rows_imported.should == 30
        results[0].import_type.should   == '.csv'
      end
    
      it "should import CSV with latidude/logitude" do
        importer = create_importer 'walmart.csv'      
        results,errors = importer.import!

        results[0].name.should == 'walmart'
        results[0].rows_imported.should == 3176
        results[0].import_type.should == '.csv'
      end

      it "should import CSV with lat/lon" do
        importer = create_importer 'walmart_latlon.csv', 'walmart_latlon'      
        results,errors = importer.import!

        results[0].name.should == 'walmart_latlon'
        results[0].rows_imported.should == 3176
        results[0].import_type.should == '.csv'
      end

      pending "should CartoDB CSV export with latitude & longitude columns" do
        importer = create_importer 'CartoDB_csv_export.zip', 'cartodb_csv_export'                  
        results,errors = importer.import!
      
        results[0].name.should == 'cartodb_csv_export'
        results[0].rows_imported.should == 155
        results[0].import_type.should == '.csv'

        # test auto generation of geom from lat/long fields
        res = @db[:cartodb_csv_export].select{[st_x(the_geom), st_y(the_geom), latitude, longitude]}.limit(1).first
        res[:st_x].should == res[:longitude].to_f
        res[:st_y].should == res[:latitude].to_f
      end
  
      it "should CartoDB CSV export with the_geom in geojson" do
        importer = create_importer 'CartoDB_csv_multipoly_export.zip', 'cartodb_csv_multipoly_export'
        results,errors = importer.import!

        results[0].name.should == 'cartodb_csv_multipol'
        results[0].rows_imported.should == 601
        results[0].import_type.should == '.csv'
      end
    
      it "should import CSV file with columns who are numbers" do
        importer = create_importer 'csv_with_number_columns.csv', 'csv_with_number_columns'
        results,errors = importer.import!

        results[0].name.should == 'csv_with_number_colu'
        results[0].rows_imported.should == 177

        results[0].import_type.should == '.csv'      
      end
    end
  
    describe "#XLSX" do
      it "should import a XLSX file in the given database in a table named like the file" do
        importer = create_importer 'ngos.xlsx'
        results,errors = importer.import!
        
        errors.length.should            == 0
        results[0].name.should          == 'ngos'
        results[0].rows_imported.should == 76
        results[0].import_type.should   == '.xlsx'
      end
    end
  
    describe "#KML" do
      it "should import KMZ file rmnp.kmz" do
        importer = create_importer 'rmnp.kmz', "rmnp2"      
        results,errors = importer.import!
        
        results.length.should           == 1
        results[0].name.should          == 'rmnp2'
        results[0].rows_imported.should == 1
        results[0].import_type.should   == '.kml'
      end
    end

    describe "#GeoJSON" do
      it "should import GeoJSON file simple.json" do
        importer = create_importer 'simple.json'
        results,errors = importer.import!

        results[0].name.should          == 'simple'
        results[0].rows_imported.should == 11

        results[0].import_type.should   == '.json'
      end

      it "should import GeoJSON file geojson.geojson" do
        importer = create_importer 'geojson.geojson'
        results,errors = importer.import!

        results[0].name.should          == 'geojson'
        results[0].rows_imported.should == 4

        results[0].import_type.should   == '.geojson'
      end
      
      pending "should import GeoJSON files from URLs with non-UTF-8 chars converting if needed" do
        importer = create_importer "http://raw.github.com/gist/1374824/d508009ce631483363e1b493b00b7fd743b8d008/unicode.json", 'geojson_utf8', true
        results, errors = importer.import!
        results.length.should           == 1
        @db[:geojson_utf8].get(:tm_symbol).should == "In here -> ® <-- this here"
      end      
    end
  
    describe "#SHP" do    
      it "should import SHP file TM_WORLD_BORDERS_SIMPL-0.3.zip" do
        importer = create_importer 'TM_WORLD_BORDERS_SIMPL-0.3.zip'
        results,errors = importer.import!
      
        results[0].name.should          == 'tm_world_borders_sim'
        results[0].rows_imported.should == 246
        results[0].import_type.should   == '.shp'
      end
      
      it "should import SHP file TM_WORLD_BORDERS_SIMPL-0.3.zip but set the given name" do
        importer = create_importer 'TM_WORLD_BORDERS_SIMPL-0.3.zip', 'borders'
        results,errors = importer.import!

        results[0].name.should          == 'borders'
        results[0].rows_imported.should == 246
        results[0].import_type.should   == '.shp'
      end
    end
    
    describe "#GPX file" do
      it "should import GPX file" do
        importer = create_importer 'route2.gpx'                  
        results,errors = importer.import!
        
        results.length.should           == 2
        results[0].name.should          == 'route2_track_points'
        results[0].rows_imported.should == 822
        results[0].import_type.should   == '.gpx'
        results[1].name.should          == 'route2_tracks'
        results[1].rows_imported.should == 1
        results[1].import_type.should   == '.gpx'
      end
    end    
    
    describe "#GTIFF" do
      it "should import a GTIFF file in the given database in a table named like the file" do
        importer = create_importer 'GLOBAL_ELEVATION_SIMPLE.zip'      
        results,errors = importer.import!
      
        results[0].name.should          == 'global_elevation_sim'
        results[0].rows_imported.should == 1500
        results[0].import_type.should   == '.tif'
      end
    end  
    
    describe "Natural Earth Polygons" do
      it "should import Natural Earth Polygons" do
        importer = create_importer '110m-glaciated-areas.zip', 'glaciers'                  
        results,errors = importer.import!
      
        results[0].name.should          == 'glaciers'
        results[0].rows_imported.should == 11
        results[0].import_type.should   == '.shp'
      end
    end  
  
    pending "Import from URL" do
      it "should import a shapefile from NaturalEarthData.com" do
        importer = create_importer "http://www.nacis.org/naturalearth/10m/cultural/10m_parks_and_protected_areas.zip", "_10m_us_parks", true
        results,errors = importer.import!

        @db.tables.should include(:_10m_us_parks)
        results[0].name.should          == '_10m_us_parks'
        results[0].rows_imported.should == 312
        results[0].import_type.should   == '.shp'
      end
    end    
      
    describe "Import from user specific files" do
    
      it "should import a shapefile from Simon" do
        importer = create_importer 'simon-search-spain-1297870422647.zip'                  
        results,errors = importer.import!
      
        results[0].rows_imported.should == 601
        results[0].import_type.should   == '.shp'
      end

      it "should import this KML ZIP file" do
        importer = create_importer 'states.kml.zip'
        results,errors = importer.import!

        results[0].rows_imported.should == 56
        results[0].import_type.should   == '.kml'
      end
  
      it "should import CartoDB SHP export with lat/lon" do
        importer = create_importer 'CartoDB_shp_export.zip', 'cartodb_shp_export'
        results,errors = importer.import!

        results[0].name.should == 'cartodb_shp_export'
        results[0].rows_imported.should == 155
        results[0].import_type.should == '.shp'
      
        # test geometry is correct
        res = @db[:cartodb_shp_export].select{[st_x(the_geom),st_y(the_geom)]}.first
        res.should == {:st_x=>16.5607329, :st_y=>48.1199611}
      end
        
    end  
  end
  
  context "table model to data import integration tests" do
    context "csv standard tests" do
      pending "should import file twitters.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/twitters.csv"
        table.save.reload
        table.name.should match(/^twitters/)
        table.rows_counted.should == 7

        check_schema(table, [
          [:cartodb_id, "integer"], [:url, "text"], [:login, "text"], 
          [:country, "text"], [:followers_count, "text"],  
          [:created_at, "timestamp without time zone"], [:updated_at, "timestamp without time zone"],
          [:the_geom, "geometry", "geometry", "point"]
        ])
        row = table.records[:rows][0]
        row[:url].should == "http://twitter.com/vzlaturistica/statuses/23424668752936961"
        row[:login].should == "vzlaturistica "
        row[:country].should == " Venezuela "
        row[:followers_count].should == "211"
      end
      pending "should import ngoaidmap_projects.csv" do
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
        parsed[0].should == ["cartodb_id", "country", "followers_count", "login", "url", "created_at", "updated_at", "the_geom"]
        parsed[1].first.should == "1"
      end
      pending "should import file import_csv_1.csv" do
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
      pending "should import file import_csv_2.csv" do
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
      pending "should import file arrivals_BCN.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/arrivals_BCN.csv"
        table.save
        table.reload
        table.name.should == 'arrivals_bcn'
        table.rows_counted.should == 3855
      end
      pending "should import file clubbing.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/clubbing.csv"
        table.save
        table.reload
        table.name.should == 'clubbing'
        table.rows_counted.should == 1998
      end

      pending "should import file short_clubbing.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/short_clubbing.csv"
        table.save
        table.reload
        table.name.should == 'short_clubbing'
        table.rows_counted.should == 78
      end

      pending "should import ngos_aidmaps.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/ngos_aidmaps.csv"
        table.save
        table.reload
        table.name.should == 'ngos_aidmaps'
        table.rows_counted.should == 85
      end

      pending "should import estaciones.csv" do
        table = new_table :name => nil
        table.import_from_file = "#{Rails.root}/db/fake_data/estaciones.csv"
        table.save
        table.reload
        table.name.should == 'estaciones'
        table.rows_counted.should == 30
      end

      pending "should import estaciones2.csv" do
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
        table.rows_counted.should == 99
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
  end
  
  context "it should pass any remaining failing files from remote uploads" do
    context "existing failed remote files" do
      'pass'.should=='pass'
    end 
  end
  ##################################################
  # configuration & helpers for tests
  ##################################################
  before(:all) do
    @db = CartoDB::ImportDatabaseConnection.connection
    @db_opts = {:database => "cartodb_importer_test", 
                :username => "postgres", :password => '',
                :host => 'localhost', 
                :port => 5432}
  end
  
  after(:all) do
    CartoDB::ImportDatabaseConnection.drop
  end
  
  def file file
    File.expand_path("../../support/data/#{file}", __FILE__)    
  end
  
  def create_importer file_name, suggested_name=nil, is_url=false
    # sanity check
    throw "filename required" unless file_name
    
    # configure opts    
    if is_url
      opts = {:import_from_url => file_name}
    else
      opts = {:import_from_file => file(file_name)}
    end
    opts[:suggested_name] = suggested_name if suggested_name.present?
    opts[:data_import_id] = get_data_import_id()
    opts[:remaining_quota] = 50000000
    # build importer
    CartoDB::Importer.new opts.reverse_merge(@db_opts)
  end        
  def check_schema(table, expected_schema, options={})
    table_schema = table.schema(:cartodb_types => options[:cartodb_types] || false)
    schema_differences = (expected_schema - table_schema) + (table_schema - expected_schema)
    schema_differences.should be_empty, "difference: #{schema_differences.inspect}"
  end         
  def get_data_import_id()
    @data_import  = DataImport.new(:user_id => 0)
    @data_import.updated_at = Time.now
    @data_import.save     
    @data_import.id
  end
end


