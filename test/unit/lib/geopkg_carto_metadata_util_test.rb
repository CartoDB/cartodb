require 'test_helper'
require 'geopkg_carto_metadata_util'

class GpkgCartoMetadataUtilTest < ActiveSupport::TestCase
  test "Invalid geopkg file" do
    assert_raise(ActiveRecord::StatementInvalid) do
      f = GpkgCartoMetadataUtil.new(geopkg_file: 'test/unit/lib/test_gpkg_files/invalidfile')
    end
  end

  test "Default State" do
    f = GpkgCartoMetadataUtil.new(geopkg_file: 'test/unit/lib/test_gpkg_files/blankfile')
    # Default should be blank hash
    assert_equal( {}, f.metadata )
  end

  test "Set Invalid metadata" do
    # Start from blank slate
    f = GpkgCartoMetadataUtil.new(geopkg_file: 'test/unit/lib/test_gpkg_files/blankfile')
    # Set metadata
    assert_raise(ArgumentError) do
      f.metadata = nil
    end
  end

  test "Set Metadata" do
    # Start from blank slate
    f = GpkgCartoMetadataUtil.new(geopkg_file: 'test/unit/lib/test_gpkg_files/blankfile')
    # Set metadata
    md = {
           "data" => {
             "source" => {
               "type" => "url",
               "configuration" => {
                 "url" => "foo.com",
                 "refresh_interval_in_seconds" => 900
               }
             }
           }
         }
    f.metadata = md
    # Default should be blank hash
    assert_equal( md, f.metadata )
  end

end
