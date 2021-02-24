require 'fileutils'
require_relative '../../lib/importer/shp_helper'
require_relative '../../lib/importer/exceptions'

include CartoDB::Importer2

describe CartoDB::Importer2::ShpHelper do
  describe '#row_count' do
    it 'return total of rows correctly' do
      path = File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/county_usa/county_usa.shp"))
      shp_helper = CartoDB::Importer2::ShpHelper.new(path)
      shp_helper.total_rows.should eq 3233
    end

    it 'verify correct shp file has prj, shx and dbf files in the same folder' do
      path = File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/county_usa/county_usa.shp"))
      shp_helper = CartoDB::Importer2::ShpHelper.new(path)
      shp_helper.verify_file.should eq true
    end

    it 'verify return exception if shp file doesnt has shx or dbf file in the same folder' do
      path = File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/shp_no_dbf.shp"))
      expect{
        shp_helper = CartoDB::Importer2::ShpHelper.new(path)
      }.to raise_error InvalidShpError
    end

    it 'verify return exception if shp file doesnt has prj file in the same folder' do
      pending("removed method to give a default projection to file") do
        path = File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/shp_no_prj.shp"))
        expect{
          shp_helper = CartoDB::Importer2::ShpHelper.new(path)
        }.to raise_error MissingProjectionError
      end
    end

  end

end
