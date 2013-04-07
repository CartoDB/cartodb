# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../lib/importer/lib/cartodb-importer/decompressors/kmz'

describe CartoDB::KMZ do
  before do
    raw_file_path = File.expand_path(
      File.join(File.dirname(__FILE__), '../../support/data/rmnp.kmz')
    )

    @decompressor = CartoDB::KMZ.new(
      path:           raw_file_path,
      suggested_name: 'rmnp',
    )
  end

  describe '#process' do
    it 'returns import data' do
      import = @decompressor.process!
      import.length.must_equal 1
      import.first.fetch(:ext)            .must_equal '.kml'
      import.first.fetch(:suggested_name) .must_equal 'rmnp'
      import.first.fetch(:path)           .must_match /tmp.*rmnp.kml/
    end

    it 'extracts a temporary KML file' do
      import = @decompressor.process!
      File.exists?(import.first.fetch(:path)).must_equal true
    end

    it 'raises ExtractionError if unsuccessful' do
      decompressor  = CartoDB::KMZ.new(
        path:           'non_existent',
        suggested_name: 'dummy'
      )
      lambda { decompressor.process! }.must_raise CartoDB::ExtractionError
    end
  end #process
end # CartoDB::KMZ

