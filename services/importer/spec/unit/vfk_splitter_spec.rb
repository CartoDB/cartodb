# encoding: utf-8

require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'

# Unp includes reference to vfk_splitter
require_relative '../../lib/importer/unp'

describe CartoDB::Importer2::VfkSplitter do
  before do
    @multiple_layer_filepath  = path_to('katastr.vfk')
    @temporary_directory      = '/var/tmp'
    @ogr2ogr_config = {}
  end

  describe '#run' do
    it 'splits a multilayer VFK into single-layer VFK' do
      source_file = CartoDB::Importer2::SourceFile.new(@multiple_layer_filepath)
      splitter    = CartoDB::Importer2::VfkSplitter.new(source_file, @temporary_directory, @ogr2ogr_config)
      splitter.run
      splitter.source_files.length.should eq 2
    end

  end

  describe '#layers_in' do
    it 'returns all layers name in the file' do
      source_file = CartoDB::Importer2::SourceFile.new(@multiple_layer_filepath)
      splitter    = CartoDB::Importer2::VfkSplitter.new(source_file, @temporary_directory, @ogr2ogr_config)
      splitter.layers_in(source_file).length.should eq 2
      splitter.layers_in(source_file).should eq ["pts", "lns"]
    end
  end

  def path_to(filepath)
    File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/#{filepath}"))
  end
end
