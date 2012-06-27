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
      
      it "should import GeoJSON files from URLs with non-UTF-8 chars converting if needed" do
        importer = create_importer "https://raw.github.com/gist/1374824/d508009ce631483363e1b493b00b7fd743b8d008/unicode.json", 'geojson_utf8', true
        results, errors = importer.import!
        results.length.should           == 1
        @db[:geojson_utf8].get(:reg_symbol).should == "In here -> ® <-- this here"
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
        results[0].rows_imported.should == 774
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
  end
  context "expected error results" do
    describe "#Multifile imports" do
      it "one file should fail while the other should be imported fine" do
        importer = create_importer '1good1bad.zip'
        results, errors = importer.import!
        # Assertions
        errors.length.should            == 1  
        results.length.should           == 1
        results[0].rows_imported.should == 7
        results[0].import_type.should   == '.csv'
        results[0].name.should          == 'twitters'
        @db.tables.should_not include(:empty)    
      end
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


