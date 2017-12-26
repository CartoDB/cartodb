# encoding: utf-8
require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'

# Unp includes reference to kml_splitter
require_relative '../../lib/importer/unp'

describe CartoDB::Importer2::GpxSplitter do
  before do
    @one_layer_filepath       = path_to('one_layer.gpx')
    @multiple_layer_filepath  = path_to('multiple_layer.gpx')
    @temporary_directory      = '/var/tmp'
    @ogr2ogr_config = {}
  end

  describe '#run' do
    it 'splits a multilayer GPX into single-layer GPX' do
      source_file = CartoDB::Importer2::SourceFile.new(@multiple_layer_filepath)
      splitter    = CartoDB::Importer2::GpxSplitter.new(source_file, @temporary_directory, @ogr2ogr_config)
      splitter.run
      splitter.source_files.length.should eq 4
    end

    it 'splits a single-layer GPX into multiple-layer GPX' do
      source_file = CartoDB::Importer2::SourceFile.new(@one_layer_filepath)
      splitter    = CartoDB::Importer2::GpxSplitter.new(source_file, @temporary_directory, @ogr2ogr_config)
      splitter.run
      # route and track with the points layer too (track and track_points)
      splitter.source_files.length.should eq 2
    end
  end

  describe '#layers_in' do
    it 'returns all layers name in the file' do
      source_file = CartoDB::Importer2::SourceFile.new(@one_layer_filepath)
      splitter    = CartoDB::Importer2::GpxSplitter.new(source_file, @temporary_directory, @ogr2ogr_config)
      splitter.layers_in(source_file).should eq ["tracks", "track_points"]

      source_file = CartoDB::Importer2::SourceFile.new(@multiple_layer_filepath)
      splitter    = CartoDB::Importer2::GpxSplitter.new(source_file, @temporary_directory, @ogr2ogr_config)
      splitter.layers_in(source_file).length.should eq 4
    end
  end

  def path_to(filepath)
    File.expand_path(
      File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
    )
  end
end
