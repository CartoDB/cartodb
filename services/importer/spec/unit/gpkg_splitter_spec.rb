# encoding: utf-8

require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'

# Unp includes reference to fgdb_splitter
require_relative '../../lib/importer/unp'

describe CartoDB::Importer2::GpkgSplitter do
  before do
    @multiple_layer_filepath  = path_to('geopackage.gpkg')
    @difficult_layer_filepath  = path_to('difficult_layer_names.gpkg')
    @temporary_directory      = '/var/tmp'
    @ogr2ogr_config = {}
  end

  describe '#run' do
    it 'splits a multilayer GPKG into single-layer GPKG' do
      source_file = CartoDB::Importer2::SourceFile.new(@multiple_layer_filepath)
      splitter    = CartoDB::Importer2::GpkgSplitter.new(source_file, @temporary_directory, @ogr2ogr_config)
      splitter.run
      splitter.source_files.length.should eq 2
    end

  end

  describe '#layers_in' do
    it 'returns all layers name in the file' do
      source_file = CartoDB::Importer2::SourceFile.new(@multiple_layer_filepath)
      splitter    = CartoDB::Importer2::GpkgSplitter.new(source_file, @temporary_directory, @ogr2ogr_config)
      splitter.layers_in(source_file).length.should eq 2
      splitter.layers_in(source_file).should eq ["pts", "lns"]
    end
  end

  describe '#difficult_layers' do
    it 'returns all complexly labelled layers' do
      source_file = CartoDB::Importer2::SourceFile.new(@difficult_layer_filepath)
      splitter    = CartoDB::Importer2::GpkgSplitter.new(source_file, @temporary_directory, @ogr2ogr_config)
      lyrs = splitter.layers_in(source_file)
      lyrs.length.should eq 5
      lyrs.should eq ["LayerMixedCase", "Layer with Spaces and 'Punctuation", "LayerUnknownGType", "Unknown GeomType and Spaces", "Unknown GeomType and Spaces and $#!'@Punctuation"]
      sff = splitter.source_files_for(source_file, lyrs)
      sff.map do |sf|
        file_exists = File.file?(sf.fullpath)
        file_exists.should eq true
      end
      FileUtils.rm_rf(@temporary_directory)
    end
  end

  def path_to(filepath)
    File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/#{filepath}"))
  end
end
