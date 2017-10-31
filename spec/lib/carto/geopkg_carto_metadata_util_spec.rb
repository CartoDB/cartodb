require_relative '../../../lib/carto/geopkg_carto_metadata_util'

describe Carto::GpkgCartoMetadataUtil do
  it "Invalid geopkg file" do
    expect {
      Carto::GpkgCartoMetadataUtil.new(geopkg_file: 'spec/lib/test_gpkg_files/invalidfile')
    }.to raise_error(SQLite3::SQLException)
  end

  it "Default State" do
    f = Carto::GpkgCartoMetadataUtil.new(geopkg_file: 'spec/lib/test_gpkg_files/blankfile')
    # Default should be blank hash
    expect(f.metadata).to eq({ vendor: 'carto' }.with_indifferent_access)
  end

  it "Default State With Incorrect vendor" do
    f = Carto::GpkgCartoMetadataUtil.new(geopkg_file: 'spec/lib/test_gpkg_files/incorrect_vendor')
    # Default should be blank hash
    expect(f.metadata).to eq({ vendor: 'carto' }.with_indifferent_access)
  end

  it "Set Invalid metadata" do
    # Start from blank slate
    f = Carto::GpkgCartoMetadataUtil.new(geopkg_file: 'spec/lib/test_gpkg_files/blankfile')
    # Set metadata
    expect {
      f.metadata = nil
    }.to raise_error(ArgumentError)
  end

  it "Set Metadata No Write" do
    # Start from blank slate
    f = Carto::GpkgCartoMetadataUtil.new(geopkg_file: 'spec/lib/test_gpkg_files/blankfile')
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
    expect(f.metadata).to eq(md.with_indifferent_access)
  end

  it "Set Metadata With Write" do
    # Start from blank slate
    testfile = Tempfile.new('carto_geopkg_test_set_metadata_with_write')
    File.open('spec/lib/test_gpkg_files/blankfile') do |f|
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

    Carto::GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      # Set metadata
      gpkgfile.metadata = md
      # Default should be blank hash
      expect(gpkgfile.metadata).to eq(md.with_indifferent_access)
    end

    # Re-open the file and verify the metadata changed
    Carto::GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      expect(gpkgfile.metadata).to eq(md.with_indifferent_access)
    end
  end

  it "Set Metadata Without vendor property" do
    # Start from blank slate
    f = Carto::GpkgCartoMetadataUtil.new(geopkg_file: 'spec/lib/test_gpkg_files/blankfile')
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
    expect(f.metadata).to eq(expected_md.with_indifferent_access)
  end

  it "Set Metadata Without vendor property With Write" do
    # Start from blank slate
    testfile = Tempfile.new('carto_geopkg_test_set_metadata_without_vendor_with_write')
    File.open('spec/lib/test_gpkg_files/blankfile') do |f|
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

    Carto::GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      # Set metadata
      gpkgfile.metadata = md
      # Default should be blank hash
      expect(gpkgfile.metadata).to eq(expected_md.with_indifferent_access)
    end

    # Re-open the file and verify the metadata changed
    Carto::GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      expect(gpkgfile.metadata).to eq(expected_md.with_indifferent_access)
    end
  end

  it "Set Metadata Multiple Times With Write" do
    # Start from blank slate
    testfile = Tempfile.new('carto_geopkg_test_set_metadata_multiple_times_with_write')
    File.open('spec/lib/test_gpkg_files/blankfile') do |f|
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

    Carto::GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      # Set metadata
      gpkgfile.metadata = md
      # Default should be blank hash
      expect(gpkgfile.metadata).to eq(md.with_indifferent_access)
    end

    # Re-open the file, verify the metadata changed, and re-write new values
    Carto::GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      expect(gpkgfile.metadata).to eq(md.with_indifferent_access)

      md['data']['source']['configuration']['refresh_interval_in_seconds'] = 789
      gpkgfile.metadata = md
      expect(gpkgfile.metadata).to eq(md.with_indifferent_access)
    end

    # Re-open the file one last time to verify the changes
    Carto::GpkgCartoMetadataUtil.open(geopkg_file: testfile.path) do |gpkgfile|
      expect(gpkgfile.metadata).to eq(md.with_indifferent_access)
      expect(789).to eq(gpkgfile.metadata['data']['source']['configuration']['refresh_interval_in_seconds'])
    end
  end
end
