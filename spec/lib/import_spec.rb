# encoding: utf-8
require_relative '../spec_helper'

describe CartoDB::Importer do
  context "basic functionality" do
    it "wont set the error code if data is imported successfully" do
      importer = create_importer 'TM_WORLD_BORDERS_SIMPL-0.3.zip'
      results, errors = importer.import!

      importer.data_import.reload
      importer.data_import.error_code.should be nil
    end

    it "should raise an error if :import_from_file option is blank" do
      lambda {
        CartoDB::Importer.new(:data_import_id => get_data_import_id)
      }.should raise_error("import_from_file value can't be blank")
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

    it "should correctly handle encodings" do
      importer = create_importer 'clubbing_export.zip', 'fucked_encoding'
      results, errors   = importer.import!

      # Assertions
      results.length.should           == 1
      results[0].name.should          == 'fucked_encoding'
      results[0].rows_imported.should == 1998
      results[0].import_type.should   == '.csv'
      errors.length.should            == 0
      @db.select(:artistas).from(:fucked_encoding).all.first[:artistas].should be == 'MisteriosonorA + Dj Bombín'
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
        errors.should be_empty
        results[0].name.should          == 'data'
        results[0].rows_imported.should == 4
        results[0].import_type.should   == '.csv'
      end
      it "should import CSV even from a ZIP file with the given name" do
        importer = create_importer 'pino.zip', "table123"
        results, errors   = importer.import!

        # Assertions
        errors.should be_empty
        results[0].name.should          == 'table123'
        results[0].rows_imported.should == 4
        results[0].import_type.should   == '.csv'
      end
    end

    describe "#TAR" do
      it "should import CSV even from a tgz" do
        importer = create_importer 'pino.tgz'
        results,errors   = importer.import!

        # Assertions
        errors.should be_empty
        results[0].name.should          == 'data'
        results[0].rows_imported.should == 4
        results[0].import_type.should   == '.csv'
      end
      it "should import CSV even from a tarball" do
        importer = create_importer 'pino.tar'
        results, errors   = importer.import!

        # Assertions
        errors.should be_empty
        results[0].rows_imported.should == 4
        results[0].import_type.should   == '.csv'
      end
    end



    describe "#CSV" do
      it "should import a CSV file in the given database in a table named like the file" do
        importer = create_importer 'clubbing.csv', 'clubsaregood'
        results,errors = importer.import!

        errors.should be_empty
        results[0].name.should          == 'clubsaregood'
        results[0].rows_imported.should == 1998
        results[0].import_type.should   == '.csv'
      end

      it "should import a CSV file with invalid byte sequences" do
        importer = create_importer 'invalid_byte_seq.csv', 'invalid_byte_seq'
        results,errors = importer.import!

        errors.should be_empty
        results[0].name.should          == 'invalid_byte_seq'
        results[0].rows_imported.should == 98
        results[0].import_type.should   == '.csv'
      end

      it "should import estaciones2.csv" do
        importer = create_importer 'estaciones2.csv'
        results,errors = importer.import!

        errors.should be_empty
        results[0].name.should          == 'estaciones2'
        results[0].rows_imported.should == 30
        results[0].import_type.should   == '.csv'
      end

      it "should import CSV with latidude/logitude" do
        importer = create_importer 'walmart.csv'
        results,errors = importer.import!

        errors.should be_empty
        results[0].name.should == 'walmart'
        results[0].rows_imported.should == 3176
        results[0].import_type.should == '.csv'
      end

      it "should import CSV with lat/lon" do
        importer = create_importer 'walmart_latlon.csv', 'walmart_latlon'
        results,errors = importer.import!

        errors.should be_empty
        results[0].name.should == 'walmart_latlon'
        results[0].rows_imported.should == 3176
        results[0].import_type.should == '.csv'
      end

      it "should import CSV with latitude & longitude columns" do
        importer = create_importer 'csv_with_lat_lon.csv', 'csv_with_lat_lon'
        results,errors = importer.import!

        errors.should be_empty
        results[0].name.should == 'csv_with_lat_lon'
        results[0].rows_imported.should == 155
        results[0].import_type.should == '.csv'

        # test auto generation of geom from lat/long fields
        res = @db[:csv_with_lat_lon].select{[st_x(the_geom), st_y(the_geom), latitude, longitude]}.limit(1).first
        res[:st_x].should == res[:longitude].to_f
        res[:st_y].should == res[:latitude].to_f
      end

      it "should import CSV export with the_geom in geojson" do
        importer = create_importer 'CartoDB_csv_multipoly_export.zip', 'cartodb_csv_multipoly_export'
        results,errors = importer.import!

        errors.should be_empty
        results[0].name.should == 'cartodb_csv_multipoly_export'
        results[0].rows_imported.should == 601
        results[0].import_type.should == '.csv'
      end

      it "should import CSV file with columns who are numbers" do
        importer = create_importer 'csv_with_number_columns.csv', 'csv_with_number_columns'
        results,errors = importer.import!

        errors.should be_empty
        results[0].name.should == 'csv_with_number_columns'
        results[0].rows_imported.should == 177

        results[0].import_type.should == '.csv'
      end

      it "should import a CSV file with only one column" do
        pending <<-EOF.gsub('          ', '')
          ogr2ogr doesn't support csv with a single column. A posible workaround is to
          manually add an empty column at the end of csv with only one column. But looks
          like this solution could add further problems with regular csv files which works
           well.
        EOF
        importer = create_importer 'csv_with_one_column.csv', 'csv_with_one_column'
        results, errors = importer.import!

        errors.should be_empty
        results[0].name.should == 'csv_with_one_column'
        results[0].rows_imported.should == 38

        results[0].import_type.should == '.csv'
      end

      it "can import a csv which has problems with the header row" do
        importer = create_importer 'soy-bean-cleaned-wahwah.csv'
        results, errors = importer.import!

        errors.should be_empty
        results[0].name.should == 'soy_bean_cleaned_wahwah'
        results[0].rows_imported.should == 238

        results[0].import_type.should == '.csv'
      end

      it "can import a tabbed csv which has problems when importing it" do
        importer = create_importer 'cambodia_pop_tabbed_data.csv'
        results, errors = importer.import!

        errors.should be_empty
        results[0].name.should == 'cambodia_pop_tabbed_data'
        results[0].rows_imported.should == 99

        results[0].import_type.should == '.csv'
      end

      it 'imports a csv with a blank column' do
        importer = create_importer 'twitters_with_blank_column.csv'
        results, errors = importer.import!

        errors.should be_empty
        results[0].name.should == 'twitters_with_blank_column'
        results[0].import_type.should == '.csv'
        results[0].rows_imported.should == 7
      end

      it 'imports a csv with a column with a blank header' do
        importer = create_importer 'twitters_with_headerless_column.csv'
        results, errors = importer.import!

        errors.should be_empty
        results[0].name.should == 'twitters_with_headerless_column'
        results[0].import_type.should == '.csv'
        results[0].rows_imported.should == 7
        columns = @db[:twitters_with_headerless_column].columns
        columns.grep(/header_/).empty?.should == false
      end

      it 'imports a csv with an existing cartodb_id column' do
        importer = create_importer 'nyc_subway_entrance_export.csv'
        results, errors = importer.import!

        errors.should be_empty
        results[0].name.should == 'nyc_subway_entrance_export'
        results[0].import_type.should == '.csv'
        results[0].rows_imported.should == 1904
      end
    end # CSV

    describe "#XLSX" do
      it "should import a XLSX file in the given database in a table named like the file" do
        importer = create_importer 'ngos.xlsx'
        results,errors = importer.import!

        errors.should be_empty
        results[0].name.should          == 'ngos'
        results[0].rows_imported.should == 76
        results[0].import_type.should   == '.xlsx'
      end
    end

    describe "#KML" do
      it "should import KMZ file rmnp.kmz" do
        importer = create_importer 'rmnp.kmz', "rmnp2"
        results,errors = importer.import!

        errors.should be_empty
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

        errors.should be_empty
        results[0].name.should          == 'simple'
        results[0].rows_imported.should == 11
        results[0].import_type.should   == '.json'
      end

      it "should import GeoJSON file geojson.geojson" do
        importer = create_importer 'geojson.geojson'
        results,errors = importer.import!

        errors.should be_empty
        results[0].name.should          == 'geojson'
        results[0].rows_imported.should == 4
        results[0].import_type.should   == '.geojson'
      end

      it "should import GeoJSON files from URLs with non-UTF-8 chars converting if needed" do
        importer = create_importer "https://raw.github.com/gist/1374824/d508009ce631483363e1b493b00b7fd743b8d008/unicode.json", 'geojson_utf8', true
        results, errors = importer.import!
        results.length.should == 1
        @db[:geojson_utf8].get(:reg_symbol).force_encoding('UTF-8').should == "In here -> ® <-- this here"
      end

      it 'should import data previously exported through the SQL API', now: true do
        importer = create_importer 'tm_world_borders_simpl_0_8.geojson'
        results, errors = importer.import!

        errors.should be_empty
        puts results[0].rows_imported
      end
    end

    describe "#SHP" do
      it "should import SHP file TM_WORLD_BORDERS_SIMPL-0.3.zip" do
        importer = create_importer 'TM_WORLD_BORDERS_SIMPL-0.3.zip'
        results,errors = importer.import!

        results[0].name.should          == 'tm_world_borders_simpl_0_3'
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

      it 'can import a Spain GADM file' do
        importer = create_importer 'ESP_adm.zip'
        results,errors = importer.import!

        results.length.should                  == 10
        results.map(&:name).should be          =~ ["esp_adm0", "esp_adm0_1", "esp_adm1", "esp_adm1_1", "esp_adm2", "esp_adm2_1", "esp_adm3", "esp_adm3_1", "esp_adm4", "esp_adm4_1"]
        results.map(&:rows_imported).should be =~ [1, 1, 18, 18, 51, 51, 368, 368, 8298, 8298]
        results.map(&:import_type).should be   =~ [".csv", ".shp", ".csv", ".shp", ".csv", ".shp", ".csv", ".shp", ".csv", ".shp"]
      end

      it 'can import a Spain GADM file from an url' do
        importer = create_importer 'http://www.filefactory.com/file/13m5trz7vkzb/n/ESP_adm_zip', 'esp_adm', true
        results,errors = importer.import!

        results.length.should                  == 10
        results.map(&:name).should be          =~ ["esp_adm", "esp_adm_1", "esp_adm_2", "esp_adm_3", "esp_adm_4", "esp_adm_5", "esp_adm_6", "esp_adm_7", "esp_adm_8", "esp_adm_9"]
        results.map(&:rows_imported).should be =~ [1, 1, 18, 18, 51, 51, 368, 368, 8298, 8298]
        results.map(&:import_type).should be   =~ [".csv", ".shp", ".csv", ".shp", ".csv", ".shp", ".csv", ".shp", ".csv", ".shp"]
      end

      it 'can import the file ne_10m_coastline.zip' do
        importer = create_importer 'ne_10m_coastline.zip'
        results,errors = importer.import!

        results.length.should              == 1
        results[0].name.should be          == 'ne_10m_coastline'
        results[0].rows_imported.should be == 4102
        results[0].import_type.should be   == '.shp'
      end

      it 'can import the file ne_10m_admin_0_countries.zip' do
        importer = create_importer 'ne_10m_admin_0_countries.zip'
        results,errors = importer.import!

        results.length.should              == 1
        results[0].name.should be          == 'ne_10m_admin_0_countries'
        results[0].rows_imported.should be == 254
        results[0].import_type.should be   == '.shp'
      end
    end

    describe "#GPX file" do
      it "should import GPX file" do
        importer = create_importer 'activity_234497933.gpx'
        results,errors = importer.import!

        errors.length.should            == 3
        results.length.should           == 2
        results[0].name.should          == 'activity_234497933_track_points'
        results[0].rows_imported.should == 440
        results[0].import_type.should   == '.gpx'
        results[1].name.should          == 'activity_234497933_tracks'
        results[1].rows_imported.should == 1
        results[1].import_type.should   == '.gpx'
      end
    end

    describe "#GTIFF" do
      it "should import a GTIFF file in the given database in a table named like the file" do
        importer = create_importer 'GLOBAL_ELEVATION_SIMPLE.zip'
        results,errors = importer.import!

        results[0].name.should          == 'global_elevation_simple'
        results[0].rows_imported.should == 774
        results[0].import_type.should   == '.tif'
      end
    end

    describe "#GML" do
      it "should import a GML file" do
        importer = create_importer 'data.gml'
        results,errors = importer.import!

        results[0].name.should          == 'data'
        results[0].rows_imported.should == 1
        results[0].import_type.should   == '.gml'
      end
    end

    describe "#JSON" do
      it "should import a JSON file in the given database in a table named like the file" do
        importer = create_importer 'clubbing.json', 'clubsaregood'
        results,errors = importer.import!

        results[0].name.should          == 'clubsaregood'
        results[0].rows_imported.should == 5
        results[0].import_type.should   == '.json'
      end

      it "should import estaciones2.json" do
        importer = create_importer 'estaciones2.json'
        results,errors = importer.import!

        results[0].name.should          == 'estaciones2'
        results[0].rows_imported.should == 30
        results[0].import_type.should   == '.json'
      end

      it "should import JSON with latidude/logitude" do
        importer = create_importer 'walmart.json'
        results,errors = importer.import!

        results[0].name.should == 'walmart'
        results[0].rows_imported.should == 3176
        results[0].import_type.should == '.json'
      end

      it "should import json with lat/lon" do
        importer = create_importer 'walmart_latlon.json', 'walmart_latlon'
        results,errors = importer.import!

        results[0].name.should == 'walmart_latlon'
        results[0].rows_imported.should == 3176
        results[0].import_type.should == '.json'
      end

      it "should import json file with columns who are numbers" do
        importer = create_importer 'csv_with_number_columns.json', 'csv_with_number_columns'
        results,errors = importer.import!

        results[0].name.should == 'csv_with_number_columns'
        results[0].rows_imported.should == 177

        results[0].import_type.should == '.json'
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

    describe "Import from URL" do
      it "should import a shapefile from NaturalEarthData.com" do
        serve_file Rails.root.join('spec/support/data/ne_10m_parks_and_protected_lands.zip'),
          :headers => {"content-type" => "application/zip"} do |url|
            importer = create_importer url, "_10m_us_parks", true
            results,errors = importer.import!

            @db.tables.should include(:_10m_us_parks)
            results.map(&:name).should          =~ ['_10m_us_parks', '_10m_us_parks_1', '_10m_us_parks_2', '_10m_us_parks_3']
            results.map(&:rows_imported).should =~ [29, 110, 315, 61]
            results[0].import_type.should   == '.shp'
        end
      end

      it "should infer file extension from http content-disposition header" do
        serve_file Rails.root.join('spec/support/data/MGL0905'),
          :headers => {"Content-Disposition" => "attachment; filename=MGL0905.json"} do |url|
          importer = create_importer url, nil, true
          results,errors = importer.import!

          @db.tables.should include(:mgl0905)
          errors.should be_empty
          results[0].name.should          == 'mgl0905'
          results[0].rows_imported.should == 1
          results[0].import_type.should   == '.json'
        end
      end

      it "should infer file extension from http content-type header" do
        pending "can't find a way to override content-type header on Webrick. But this works, bitches"
        serve_file Rails.root.join('spec/support/data/MGL0905'),
          :headers => {"content-type" => "application/json"} do |url|
          importer = create_importer url, nil, true
          results,errors = importer.import!

          @db.tables.should include(:mgl0905)
          errors.should be_empty
          results[0].name.should          == 'mgl0905'
          results[0].rows_imported.should == 1
          results[0].import_type.should   == '.json'
        end
      end

      it "can import urls from OSM" do
        importer = create_importer "http://www.openstreetmap.org/?lat=40.01005&lon=-105.27517&zoom=15&layers=M", "osm", true
        results,errors = importer.import!

        results.should include(OpenStruct.new(name: 'osm_line',    rows_imported: 840, import_type: '.osm', log: ''),
                               OpenStruct.new(name: 'osm_polygon', rows_imported: 265, import_type: '.osm', log: ''),
                               OpenStruct.new(name: 'osm_roads',   rows_imported: 53,  import_type: '.osm', log: ''),
                               OpenStruct.new(name: 'osm_point',   rows_imported: 451, import_type: '.osm', log: ''))
      end

      it "throws an error for OSM imports when the zoom is too big" do
        expect{
          create_importer "http://www.openstreetmap.org/?lat=37.39170&lon=-5.985950&zoom=13&layers=M", "osm", true
        }.to raise_error('You requested too many nodes (limit is 50000). Either request a smaller area, or use planet.osm')
      end

      it "can import a specific OSM url" do
        importer = create_importer "http://www.openstreetmap.org/?lat=37.39296&lon=-5.99099&zoom=15&layers=M", "osm", true
        results,errors = importer.import!

        results.should include(OpenStruct.new(name: 'osm_line',    rows_imported: 1338, import_type: '.osm', log: ''),
                               OpenStruct.new(name: 'osm_polygon', rows_imported: 543,  import_type: '.osm', log: ''),
                               OpenStruct.new(name: 'osm_roads',   rows_imported: 74,   import_type: '.osm', log: ''),
                               OpenStruct.new(name: 'osm_point',   rows_imported: 1438, import_type: '.osm', log: ''))
      end

    end

    it "should import dbf with wrong encoding" do
      importer = create_importer "Municipios.zip"
      results, errors = importer.import!

      @db.tables.should include(:cb_municipios_5000_etrs89)
      results[0].name.should          == 'cb_municipios_5000_etrs89'
      results[0].rows_imported.should == 258
      results[0].import_type.should   == '.shp'
      @db.select(:comarca).from(:cb_municipios_5000_etrs89).all.first[:comarca].should be == 'MONTAÑA ALAVESA'
    end

    it "throws an error when importing an shp with unknown srid" do
      importer = create_importer "unknown_srid_shp.zip"
      results, errors = importer.import!

      errors.should have(1).item
      errors[0].code.should be == 3008
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
      it "one file should contain 3 fails" do
        importer = create_importer '3fails.zip'
        results, errors = importer.import!
        # Assertions
        errors.length.should            == 3
        results.length.should           == 0
        @db.tables.should_not include(:empty)
      end
    end
  end

  context "using cartodb 1.0 exported files" do

    it "can import csv files" do

      importer = create_importer 'cartodb_10_export_csv.zip'
      results, errors   = importer.import!

      results.length.should           == 1
      results[0].name.should          == 'clubbing_export'
      results[0].rows_imported.should == 1998
      results[0].import_type.should   == '.csv'
      errors.length.should            == 0

    end

    it "can import shp files" do

      importer = create_importer 'cartodb_10_export_shp.zip'
      results, errors   = importer.import!

      results.length.should           == 1
      results[0].name.should          == 'gadm1_light_export'
      results[0].rows_imported.should == 10
      results[0].import_type.should   == '.shp'
      errors.length.should            == 0

    end

    it "can import KML files" do

      importer = create_importer 'cartodb_10_export_kml.kmz'
      results, errors   = importer.import!

      results.length.should           == 1
      results[0].name.should          == 'gadm1_light_export'
      results[0].rows_imported.should == 10
      results[0].import_type.should   == '.kml'
      errors.length.should            == 0

    end
  end

  context "using cartodb 2.0 exported files" do

    it "can import csv files" do

      importer = create_importer 'cartodb_20_export_csv.zip'
      results, errors   = importer.import!

      results.length.should           == 1
      results[0].name.should          == 'cartodb_20_export_csv'
      results[0].rows_imported.should == 3
      results[0].import_type.should   == '.csv'

      @db.schema(results[0].name).map {|i| i.first }.should_not include(:invalid_the_geom)
      errors.length.should            == 0
    end

    it "can import shp files" do

      importer = create_importer 'tm_world_borders_s_1.zip'
      results, errors   = importer.import!

      results.length.should           == 1
      results[0].name.should          == 'tm_world_borders_s_11'
      results[0].rows_imported.should == 246
      results[0].import_type.should   == '.shp'
      errors.length.should            == 0

    end

    it "can import KML files" do

      importer = create_importer 'counties_ny_export.kml'
      results, errors   = importer.import!

      results.length.should           == 1
      results[0].name.should          == 'counties_ny_export'
      results[0].rows_imported.should == 62
      results[0].import_type.should   == '.kml'
      errors.length.should            == 0

    end

    it "can import a csv with polygons" do
      importer = create_importer 'polygons.csv.zip'
      results, errors   = importer.import!

      results.length.should           == 1
      results[0].name.should          == 'polygons'
      results[0].rows_imported.should == 20
      results[0].import_type.should   == '.csv'
      errors.length.should            == 0

      @db.fetch("SELECT GeometryType(the_geom) FROM polygons").all.select{|r| r[:geometrytype] == 'MULTIPOLYGON'}.should have(20).items
    end

    it "can import a csv with empty geojson cells" do
      importer = create_importer 'table_50m_rivers_l_3.csv'
      results, errors   = importer.import!

      results.length.should           == 1
      results[0].name.should          == 'table_50m_rivers_l_3'
      results[0].rows_imported.should == 6
      results[0].import_type.should   == '.csv'
      errors.length.should            == 0
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
    create_user(:username => 'test', :email => "client@example.com", :password => "clientex", :table_quota => 100, :disk_quota => 500.megabytes)
    @user = User.first
  end

  after(:all) do
    CartoDB::ImportDatabaseConnection.drop
  end

  before(:each) do
    # Clean existing databases to avoid naming errors on the tests
    CartoDB::ImportDatabaseConnection.connection["select tablename from pg_tables where schemaname = 'public' and tablename != 'spatial_ref_sys'"].all.each do |table|
      CartoDB::ImportDatabaseConnection.connection.run("drop table if exists #{table[:tablename]} cascade")
    end
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
    opts[:user_id] = @user.id
    # build importer
    CartoDB::Importer.new opts.reverse_merge(@db_opts)
  end

  def get_data_import_id()
    @data_import  = DataImport.new(:user_id => @user.id)
    @data_import.updated_at = Time.now
    @data_import.save
    @data_import.id
  end
end


