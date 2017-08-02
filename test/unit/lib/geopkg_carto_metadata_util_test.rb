require 'test_helper'
require 'geopkg_carto_metadata_util'

# TODO - Convert to rspec
class GpkgCartoMetadataUtilTest < ActiveSupport::TestCase
  test "Invalid geopkg file" do
    assert_raise(SQLite3::SQLException) do
      GpkgCartoMetadataUtil.new(geopkg_file: 'test/unit/lib/test_gpkg_files/invalidfile')
    end
  end

  test "Default State" do
    f = GpkgCartoMetadataUtil.new(geopkg_file: 'test/unit/lib/test_gpkg_files/blankfile')
    # Default should be blank hash
    assert_equal({ vendor: 'carto' }.with_indifferent_access, f.metadata)
  end

  test "Default State With Incorrect vendor" do
    f = GpkgCartoMetadataUtil.new(geopkg_file: 'test/unit/lib/test_gpkg_files/incorrect_vendor')
    # Default should be blank hash
    assert_equal({ vendor: 'carto' }.with_indifferent_access, f.metadata)
  end

  test "Set Invalid metadata" do
    # Start from blank slate
    f = GpkgCartoMetadataUtil.new(geopkg_file: 'test/unit/lib/test_gpkg_files/blankfile')
    # Set metadata
    assert_raise(ArgumentError) do
      f.metadata = nil
    end
  end

  test "Set Metadata No Write" do
    # Start from blank slate
    f = GpkgCartoMetadataUtil.new(geopkg_file: 'test/unit/lib/test_gpkg_files/blankfile')
    # Set metadata
    md = {
      vendor: "carto",
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
    assert_equal(md.with_indifferent_access, f.metadata)
  end

  test "Set Metadata With Write" do
    # Start from blank slate
    testfile = Tempfile.new('carto_geopkg_test_set_metadata_with_write')
    File.open('test/unit/lib/test_gpkg_files/blankfile') do |f|
      testfile.write f.read
    end

    md = {
      vendor: "carto",
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

    GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      # Set metadata
      gpkgfile.metadata = md
      # Default should be blank hash
      assert_equal(md.with_indifferent_access, gpkgfile.metadata)
    end

    # Re-open the file and verify the metadata changed
    GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      assert_equal(md.with_indifferent_access, gpkgfile.metadata)
    end
  end

  test "Set Metadata Without vendor property" do
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

    expected_md = md
    expected_md[:vendor] = 'carto'
    # Default should be blank hash
    assert_equal(expected_md.with_indifferent_access, f.metadata)
  end

  test "Set Metadata Without vendor property With Write" do
    # Start from blank slate
    testfile = Tempfile.new('carto_geopkg_test_set_metadata_without_vendor_with_write')
    File.open('test/unit/lib/test_gpkg_files/blankfile') do |f|
      testfile.write f.read
    end

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

    expected_md = md
    expected_md[:vendor] = 'carto'

    GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      # Set metadata
      gpkgfile.metadata = md
      # Default should be blank hash
      assert_equal(expected_md.with_indifferent_access, gpkgfile.metadata)
    end

    # Re-open the file and verify the metadata changed
    GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      assert_equal(expected_md.with_indifferent_access, gpkgfile.metadata)
    end
  end

  test "Set Metadata Multiple Times With Write" do
    # Start from blank slate
    testfile = Tempfile.new('carto_geopkg_test_set_metadata_multiple_times_with_write')
    File.open('test/unit/lib/test_gpkg_files/blankfile') do |f|
      testfile.write f.read
    end

    md = {
      vendor: 'carto',
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

    GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      # Set metadata
      gpkgfile.metadata = md
      # Default should be blank hash
      assert_equal(md.with_indifferent_access, gpkgfile.metadata)
    end

    # Re-open the file, verify the metadata changed, and re-write new values
    GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      assert_equal(md.with_indifferent_access, gpkgfile.metadata)

      md['data']['source']['configuration']['refresh_interval_in_seconds'] = 789
      gpkgfile.metadata = md
      assert_equal(md.with_indifferent_access, gpkgfile.metadata)
    end

    # Re-open the file one last time to verify the changes
    GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      assert_equal(md.with_indifferent_access, gpkgfile.metadata)
    end
  end
end
