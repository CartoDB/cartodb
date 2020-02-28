require 'pg'
require 'sequel'
require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/raster2pgsql'
require_relative '../../../../spec/helpers/file_server_helper'

include CartoDB::Importer2

describe Raster2Pgsql do

  describe '#check for downsample' do
    it 'should return true for downsample because the band type is Int16' do
      filepath         = path_to('raster_simple_int16.tif')
      table_name       = "raster_test_#{rand(99999)}"
      wrapper          = CartoDB::Importer2::Raster2Pgsql.new(table_name, filepath, nil, nil)
      wrapper.need_downsample?.should eq true
    end
    it 'should return false for downsample because the band type is Byte' do
      filepath         = path_to('raster_simple.tif')
      table_name       = "raster_test_#{rand(99999)}"
      wrapper          = CartoDB::Importer2::Raster2Pgsql.new(table_name, filepath, nil, nil)
      wrapper.need_downsample?.should eq false
    end
  end

  def path_to(filepath)
    File.expand_path(
      File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
    )
  end
end

