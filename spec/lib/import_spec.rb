# coding: UTF-8

require 'spec_helper'

describe CartoDB::Importer do
      
  it "should raise an error if :import_from_file option is blank" do
    lambda { 
      CartoDB::Importer.new 
    }.should raise_error("import_from_file value can't be nil")
  end
  
  
  it "should get the table name from the options" do
    importer = create_importer 'clubbing.csv', 'prefered_name'
    result   = importer.import!
    
    # Assertions
    result.name.should          == 'prefered_name'
    result.rows_imported.should == 1998
    result.import_type.should   == '.csv'
  end
  
  
  it "should remove the table from the database if an exception happens" do
    importer = create_importer 'empty.csv'
    
    # Assertions
    lambda { importer.import! }.should raise_error    
    @db.tables.should_not include(:empty)    
  end
  
  
  # TODO: Is this really the intended behaviour??
  it "should keep first imported table when importing again with same name" do
    importer = create_importer 'clubbing.csv', 'testing'
    result   = importer.import!

    # initial assertion
    result.import_type.should == '.csv'
    
    # second creation should fail with exception
    importer = create_importer 'empty.csv', 'testing'
    lambda { importer.import! }.should raise_error
  
    # Assert has first import
    @db.tables.should include(:testing)
  end


  
  it "should suggest a new table name of the format _n if the previous table exists" do
    # import twice
    importer = create_importer 'clubbing.csv', 'clubs'
    result   = importer.import!
    
    # have to recreate to set up the general file harnesses
    importer = create_importer 'clubbing.csv', 'clubs'
    result   = importer.import!
    
    # Assert new duplicate
    result.name.should          == 'clubs_1'
    result.rows_imported.should == 1998
    result.import_type.should   == '.csv'
  end
  
  
  it "should sanitize column names" do
    importer = create_importer 'twitters.csv', 'twitters'
    result   = importer.import!
    
    # grab column names from twitters table
    columns          = @db.schema(:twitters).map{|s| s[0].to_s}    
    expected_columns = ["url", "login", "country", "followers_count"]    
    
    # Assert correct column names are added
    (expected_columns - columns).should be_empty
  end
  
  pending "should escape reserved column names" do
    importer = create_importer 'reserved_columns.csv', 'reserved_columns'
    result   = importer.import!

    # grab columns from reserved_columns table    
    columns = @db.schema(:reserved_columns).map{|s| s[0].to_s}
    expected_columns = ["url","login","country","followers_count", "_xmin"]

    # Assert reserved columns are excaped
    (expected_columns - columns).should be_empty
  end
  
  # Filetype specific tests 
  describe "#ZIP" do
    it "should import CSV even from a ZIP file" do
      importer = create_importer 'pino.zip'
      result   = importer.import!

      # Assertions
      result.name.should          == 'data'
      result.rows_imported.should == 4
      result.import_type.should   == '.csv'
    end
  
    it "should import CSV even from a ZIP file with the given name" do
      importer = create_importer 'pino.zip', "table123"
      result   = importer.import!

      # Assertions
      result.name.should          == 'table123'
      result.rows_imported.should == 4
      result.import_type.should   == '.csv'
    end
  end
  
  describe "#CSV" do
    it "should import a CSV file in the given database in a table named like the file" do
      importer = create_importer 'clubbing.csv', 'clubsaregood'
      result = importer.import!

      result.name.should          == 'clubsaregood'
      result.rows_imported.should == 1998
      result.import_type.should   == '.csv'
    end
    
    it "should import Food Security Aid Map_projects.csv" do
      importer = create_importer 'Food Security Aid Map_projects.csv'
      result = importer.import!

      result.name.should          == 'food_security_aid_map_projects'
      result.rows_imported.should == 827
      result.import_type.should   == '.csv'
    end
    
    it "should import world_heritage_list.csv" do
      importer = create_importer 'world_heritage_list.csv'
      result = importer.import!

      result.name.should          == 'world_heritage_list'
      result.rows_imported.should == 937
      result.import_type.should   == '.csv'
    end

    # NOTE: long import, takes *ages* so commented
    # it "should import cp_vizzuality_export.csv" do
    #   importer = create_importer 'cp_vizzuality_export.csv'
    #   result = importer.import!
    # 
    #   result.name.should          == 'cp_vizzuality_export'
    #   result.rows_imported.should == 19235
    #   result.import_type.should   == '.csv'
    # end
    
    # Not supported by cartodb-importer ~ v0.2.1
    # File in format different than UTF-8
    pending "should import estaciones.csv" do
      importer = create_importer 'estaciones.csv'
      result = importer.import!

      result.name.should          == 'estaciones'
      result.rows_imported.should == 29
      result.import_type.should   == '.csv'
    end
    
    it "should import estaciones2.csv" do
      importer = create_importer 'estaciones2.csv'
      result = importer.import!

      result.name.should          == 'estaciones2'
      result.rows_imported.should == 30
      result.import_type.should   == '.csv'
    end
    
    it "should import CSV with latidude/logitude" do
      importer = create_importer 'walmart.csv'      
      result = importer.import!

      result.name.should == 'walmart'
      result.rows_imported.should == 3176
      result.import_type.should == '.csv'
    end

    it "should import CSV with lat/lon" do
      importer = create_importer 'walmart_latlon.csv', 'walmart_latlon'      
      result = importer.import!

      result.name.should == 'walmart_latlon'
      result.rows_imported.should == 3176
      result.import_type.should == '.csv'
    end

    it "should CartoDB CSV export with latitude & longitude columns" do
      importer = create_importer 'CartoDB_csv_export.zip', 'cartodb_csv_export'                  
      result = importer.import!
      
      result.name.should == 'cartodb_csv_export'
      result.rows_imported.should == 155
      result.import_type.should == '.csv'

      # test auto generation of geom from lat/long fields
      res = @db[:cartodb_csv_export].select{[x(the_geom), y(the_geom), latitude, longitude]}.limit(1).first
      res[:x].should == res[:longitude].to_f
      res[:y].should == res[:latitude].to_f
    end
  
    it "should CartoDB CSV export with the_geom in geojson" do
      importer = create_importer 'CartoDB_csv_multipoly_export.zip', 'cartodb_csv_multipoly_export'
      result = importer.import!

      result.name.should == 'cartodb_csv_multipoly_export'
      result.rows_imported.should == 601
      result.import_type.should == '.csv'
      
      # test geometry returned is legit
      g = '{"type":"MultiPolygon","coordinates":[[[[1.7,39.1],[1.7,39.1],[1.7,39.1],[1.7,39.1],[1.7,39.1]]]]}'
      @db[:cartodb_csv_multipoly_export].get{ST_AsGeoJSON(the_geom,1)}.should == g
    end
    
    it "should import CSV file with lat/lon column" do
      importer = create_importer 'facility.csv', 'facility'
      result = importer.import!

      result.name.should == 'facility'
      result.rows_imported.should == 541
      result.import_type.should == '.csv'
      
      # test geometry is correct
      res = @db["SELECT x(the_geom),y(the_geom) FROM facility WHERE prop_id=' Q448 '"].first
      res.should == {:x=>-73.7698, :y=>40.6862}
    end
  
    it "should import CSV file with columns who are numbers" do
      importer = create_importer 'csv_with_number_columns.csv', 'csv_with_number_columns'
      result = importer.import!

      result.name.should == 'csv_with_number_columns'
      result.rows_imported.should == 177

      result.import_type.should == '.csv'      
    end
  end
  
  describe "#XLSX" do
    it "should import a XLSX file in the given database in a table named like the file" do
      importer = create_importer 'ngos.xlsx'
      result = importer.import!

      result.name.should          == 'ngos'
      result.rows_imported.should == 76
      result.import_type.should   == '.xlsx'
    end
  end
  
  describe "#KML" do
    it "should import KML file rmnp.kml" do
      importer = create_importer 'rmnp.kml'
      result = importer.import!

      result.name.should          == 'rmnp'
      result.rows_imported.should == 1
      result.import_type.should   == '.kml'
    end
    
    it "should import KML file rmnp.zip" do
      importer = create_importer 'rmnp.zip', "rmnp1"
      result = importer.import!

      result.name.should          == 'rmnp1'
      result.rows_imported.should == 1
      result.import_type.should   == '.kml'
    end

    it "should import KMZ file rmnp.kmz" do
      importer = create_importer 'rmnp.kmz', "rmnp2"      
      result = importer.import!

      result.name.should          == 'rmnp2'
      result.rows_imported.should == 1
      result.import_type.should   == '.kml'
    end
  end

  describe "#GeoJSON" do
    it "should import GeoJSON file simple.json" do
      importer = create_importer 'simple.json'
      result = importer.import!

      result.name.should          == 'simple'
      result.rows_imported.should == 11

      result.import_type.should   == '.json'
    end

    it "should import GeoJSON file geojson.geojson" do
      importer = create_importer 'geojson.geojson'
      result = importer.import!

      result.name.should          == 'geojson'
      result.rows_imported.should == 4

      result.import_type.should   == '.geojson'
    end
      
    pending "should import GeoJSON files from URLs with non-UTF-8 chars converting if needed" do
      url = {:import_from_url => "https://raw.github.com/gist/1374824/d508009ce631483363e1b493b00b7fd743b8d008/unicode.json", :suggested_name => 'geojson_utf8'}
      importer = CartoDB::Importer.new @db_opts.reverse_merge(url)
      result = importer.import!

      @db[:geojson_utf8].get(:reg_symbol).should == "In here -> ® <-- this here"
    end      
  end
  
  describe "#SHP" do
    it "should import a SHP file in the given database in a table named like the file" do
      importer = create_importer 'EjemploVizzuality.zip'
      result   = importer.import!

      columns = @db.schema(:vizzuality).map{|s| s[0].to_s}        
      expected_columns = %w(gid subclass x y length area angle name pid lot_navteq version_na vitesse_sp id nombrerest tipocomida)

      result.name.should          == 'vizzuality'
      result.rows_imported.should == 11
      result.import_type.should   == '.shp'
      
      @db.tables.should include(:vizzuality)
      (expected_columns - columns).should be_empty
    end
    
    it "should import SHP file TM_WORLD_BORDERS_SIMPL-0.3.zip" do
      importer = create_importer 'TM_WORLD_BORDERS_SIMPL-0.3.zip'
      result = importer.import!
      
      result.name.should          == 'tm_world_borders_simpl_0_3'
      result.rows_imported.should == 246
      result.import_type.should   == '.shp'
    end
      
    it "should import SHP file TM_WORLD_BORDERS_SIMPL-0.3.zip but set the given name" do
      importer = create_importer 'TM_WORLD_BORDERS_SIMPL-0.3.zip', 'borders'
      result = importer.import!

      result.name.should          == 'borders'
      result.rows_imported.should == 246
      result.import_type.should   == '.shp'
    end
  end
    
  describe "#GPX file" do
    it "should import GPX file" do
      importer = create_importer 'route2.gpx'                  
      result = importer.import!
      
      result.should_not           == nil
      result.name.should          == 'route2'
      result.rows_imported.should == 822
      result.import_type.should   == '.gpx'
    end
  end    
    
    
  pending "#GTIFF" do
    it "should import a GTIFF file in the given database in a table named like the file" do
      importer = create_importer 'GLOBAL_ELEVATION_SIMPLE.zip'      
      result = importer.import!
      
      result.name.should          == 'global_elevation_simple'
      result.rows_imported.should == 1500
      result.import_type.should   == '.tif'
    end
  end  
    
  describe "Natural Earth Polygons" do
    it "should import Natural Earth Polygons" do
      importer = create_importer '110m-glaciated-areas.zip', 'glaciers'                  
      result = importer.import!
      
      result.name.should          == 'glaciers'
      result.rows_imported.should == 11
      result.import_type.should   == '.shp'
    end
  end  
  
  describe "Import from URL" do
    it "should import a shapefile from NaturalEarthData.com" do
      url = {:import_from_url => "http://www.nacis.org/naturalearth/10m/cultural/10m_parks_and_protected_areas.zip"}
      importer = CartoDB::Importer.new @db_opts.reverse_merge(url)
      result = importer.import!

      @db.tables.should include(:_10m_us_parks_point)
      result.name.should          == '_10m_us_parks_point'
      result.rows_imported.should == 312
      result.import_type.should   == '.shp'
    end
  end    
  
  
  describe "Import from user specific files" do
    
    it "should import a shapefile from Simon" do
      importer = create_importer 'simon-search-spain-1297870422647.zip'                  
      result = importer.import!
      
      result.rows_imported.should == 601
      result.import_type.should   == '.shp'
    end

    it "should import this KML ZIP file" do
      importer = create_importer 'states.kml.zip'
      result = importer.import!

      result.rows_imported.should == 56
      result.import_type.should   == '.kml'
    end
  
    it "should import CartoDB SHP export with lat/lon" do
      importer = create_importer 'CartoDB_shp_export.zip', 'cartodb_shp_export'
      result = importer.import!

      result.name.should == 'cartodb_shp_export'
      result.rows_imported.should == 155
      result.import_type.should == '.shp'
      
      # test geometry is correct
      res = @db[:cartodb_shp_export].select{[x(the_geom),y(the_geom)]}.first
      res.should == {:x=>16.5607329, :y=>48.1199611}
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
  
  def create_importer file_name, suggested_name=nil
    # sanity check
    throw "filename required" unless file_name
        
    # configure opts    
    opts = {:import_from_file => file(file_name)}
    opts[:suggested_name] = suggested_name if suggested_name.present?
    
    # build importer
    CartoDB::Importer.new opts.reverse_merge(@db_opts)
  end                                    
end


