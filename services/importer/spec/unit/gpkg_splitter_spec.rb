require 'spec_helper_min'

# Unp includes reference to fgdb_splitter
require_relative '../../lib/importer/unp'

describe CartoDB::Importer2::GpkgSplitter do
  before do
    @multiple_layer_filepath  = path_to('geopackage.gpkg')
    @temporary_directory      = '/var/tmp'
    @ogr2ogr_config = {}
  end

  describe '#run' do
    it 'splits a multilayer GPKG into single-layer GPKG' do
      source_file = CartoDB::Importer2::SourceFile.new(@multiple_layer_filepath)
      splitter    = CartoDB::Importer2::GpkgSplitter.new(source_file, @temporary_directory, @ogr2ogr_config)
      splitter.run
      splitter.source_files.length.should eq 3
    end
  end

  describe '#layers_in' do
    it 'returns all layers name in the file' do
      source_file = CartoDB::Importer2::SourceFile.new(@multiple_layer_filepath)
      splitter    = CartoDB::Importer2::GpkgSplitter.new(source_file, @temporary_directory, @ogr2ogr_config)
      splitter.layers_in(source_file).length.should eq 3
      splitter.layers_in(source_file).should eq %w(census2016_spca_tas_ste_short lines points)
    end
  end

  def path_to(filepath)
    File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/#{filepath}"))
  end
end
