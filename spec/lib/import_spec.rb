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

    # NOTE: long import, takes *ages*
    pending "should import cp_vizzuality_export.csv" do
      importer = create_importer 'cp_vizzuality_export.csv'
      result = importer.import!
    
      result.name.should          == 'cp_vizzuality_export'
      result.rows_imported.should == 19235
      result.import_type.should   == '.csv'
    end
    
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
  end
  
  describe "#SHP" do
    it "should import a SHP file in the given database in a table named like the file" do
      importer = create_importer 'EjemploVizzuality.zip'
      result = importer.import!

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
    
    
  # describe "#GTIFF" do
  #   it "should import a GTIFF file in the given database in a table named like the file" do
  #     importer = CartoDB::Importer.new :import_from_file => File.expand_path("../../support/data/GLOBAL_ELEVATION_SIMPLE.zip", __FILE__),
  #                                      :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                                      :host => 'localhost', :port => 5432
  #     result = importer.import!
  #     result.name.should == 'global_elevation_simple'
  #     result.rows_imported.should == 1500
  #     result.import_type.should == '.tif'
  #   end
  # end  
  # describe "Extended" do
  #   it "should import 2 SHP files incrementing the name of the second" do
  #     importer = CartoDB::Importer.new :import_from_file => File.expand_path("../../support/data/TM_WORLD_BORDERS_SIMPL-0.3.zip", __FILE__),
  #                                      :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                                      :host => 'localhost', :port => 5432
  #     result = importer.import!
  #     result.name.should == 'tm_world_borders_simpl_0_3'
  #     #result.rows_imported.should == 4365
  #     result.import_type.should == '.shp'
  #   end
  # end  
  # describe "Natural Earth Polygons" do
  #   it "should import Natural Earth Polygons" do
  #     importer = CartoDB::Importer.new :import_from_file => File.expand_path("../../support/data/110m-glaciated-areas.zip", __FILE__),
  #                                      :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                                      :host => 'localhost', :port => 5432
  #     result = importer.import!
  #     #result.rows_imported.should == 4365
  #     result.import_type.should == '.shp'
  #   end
  # end  
  # 
  # describe "Import from URL" do
  #   it "should import a shapefile from NaturalEarthData.com" do
  #     importer = CartoDB::Importer.new :import_from_url => "http://www.nacis.org/naturalearth/10m/cultural/10m_parks_and_protected_areas.zip",
  #                                      :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                                      :host => 'localhost', :port => 5432
  #     result = importer.import!
  #     result.rows_imported.should == 312
  #     result.import_type.should == '.shp'
  #   end
  # end  
  # 
  # 
  # 
  # describe "import GPX file" do
  #     it "should import GPX file" do
  #       importer = CartoDB::Importer.new :import_from_file => File.expand_path("../../support/data/route2.gpx", __FILE__),
  #                                      :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                                      :host => 'localhost', :port => 5432
  #       result = importer.import!
  #       result.should_not == nil
  #       result.name.should == 'route2'
  #       #result.rows_imported.should == 29
  #       result.import_type.should == '.gpx'
  #     end
  # end
  # 
  # describe "Import from Simon file" do
  #   it "should import a shapefile from Simon" do
  #     importer = CartoDB::Importer.new :import_from_file => File.expand_path("../../support/data/simon-search-spain-1297870422647.zip", __FILE__),
  #                                      :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                                      :host => 'localhost', :port => 5432
  #     result = importer.import!
  #     #result.rows_imported.should == 312
  #     result.import_type.should == '.shp'
  #   end
  # end  
  # 
  # describe "Import KML" do
  #   it "should import a KML ZIP file" do
  #     importer = CartoDB::Importer.new :import_from_file => File.expand_path("../../support/data/states.kml.zip", __FILE__),
  #                                      :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                                      :host => 'localhost', :port => 5432
  #     result = importer.import!
  #     #result.rows_imported.should == 312
  #     #result.import_type.should == '.shp'
  #   end
  # end  
  # 
  # describe "Import CSV with latidude/logitude" do
  #   it "should import walmart.csv" do
  #     importer = CartoDB::Importer.new :import_from_file => File.expand_path("../../support/data/walmart.csv", __FILE__),
  #                                  :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                                  :host => 'localhost', :port => 5432, :suggested_name => 'walmart'
  #     result = importer.import!
  #     result.name.should == 'walmart'
  #     #result.rows_imported.should == 30
  #     result.import_type.should == '.csv'
  #   end
  # end
  # 
  # describe "Import CSV with lat/lon" do
  #   it "should import walmart.csv" do
  #     importer = CartoDB::Importer.new :import_from_file => File.expand_path("../../support/data/walmart_latlon.csv", __FILE__),
  #                                  :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                                  :host => 'localhost', :port => 5432, :suggested_name => 'walmart_latlon'
  #     result = importer.import!
  #     result.name.should == 'walmart_latlon'
  #     #result.rows_imported.should == 30
  #     result.import_type.should == '.csv'
  #   end
  # end  
  # 
  # describe "Import CartoDB CSV export with lat/lon" do
  #   it "should import CartoDB_csv_export.zip" do
  #     importer = CartoDB::Importer.new :import_from_file => File.expand_path("../../support/data/CartoDB_csv_export.zip", __FILE__),
  #                                  :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                                  :host => 'localhost', :port => 5432, :suggested_name => 'cartodb_csv_export'
  #     result = importer.import!
  #     result.name.should == 'cartodb_csv_export'
  #     result.rows_imported.should == 155
  #     result.import_type.should == '.csv'
  #   end
  # end  
  # 
  # # TODO: check that the_geom is now a real geometry built from geojson.
  # describe "Import CartoDB CSV export with the_geom in geojson" do
  #   it "should import CartoDB_csv_multipoly_export.zip" do
  #     opt = {:import_from_file => File.expand_path("../../support/data/CartoDB_csv_multipoly_export.zip", __FILE__),
  #                :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                :host => 'localhost', :port => 5432, :suggested_name => 'cartodb_csv_multipoly_export'}
  #     importer = CartoDB::Importer.new opt
  #     result = importer.import!
  #     result.name.should == 'cartodb_csv_multipoly_export'
  #     result.rows_imported.should == 601
  #     result.import_type.should == '.csv'
  #     
  #     # test geometry returned is legit
  #     pg = "postgres://#{opt[:username]}:#{opt[:password]}@#{opt[:host]}:#{opt[:port]}/#{opt[:database]}" 
  #     sql = "select ST_AsGeoJSON(the_geom,0) as geom from cartodb_csv_multipoly_export limit 1"
  #     db_connection = Sequel.connect(pg)            
  #     res = db_connection[sql].first[:geom]
  #     res.should == '{"type":"MultiPolygon","coordinates":[[[[2,39],[2,39],[2,39],[2,39],[2,39]]]]}'
  #   end
  # end  
  # 
  # describe "Import CartoDB SHP export with lat/lon" do
  #   it "should import CartoDB_shp_export.zip" do
  #     importer = CartoDB::Importer.new :import_from_file => File.expand_path("../../support/data/CartoDB_shp_export.zip", __FILE__),
  #                                  :database => "cartodb_importer_test", :username => "postgres", :password => '',
  #                                  :host => 'localhost', :port => 5432, :suggested_name => 'cartodb_shp_export'
  #     result = importer.import!
  #     result.name.should == 'cartodb_shp_export'
  #     result.rows_imported.should == 155
  #     result.import_type.should == '.shp'
  #   end
  # end  
  # 
  # 
  # 
  
  
  # configuration & helpers for tests
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


