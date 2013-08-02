# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'fileutils'
require 'json'
require_relative '../../lib/importer/json2csv'

include CartoDB::Importer2

describe Json2Csv do
  before do
    @data = [{ name: 'bogus name', description: 'bogus description' }]
  end

  describe '#run' do
    it 'converts a JSON file to CSV' do
      filepath  = json_factory
      converter = Json2Csv.new(filepath)
      converter.run

      data = File.open(converter.converted_filepath).readlines
      data.to_a.first.chomp.must_equal 'name,description'
    end
  end #run

  describe '#csv_from' do
    it 'generates a CSV from parsed JSON data' do 
      converter = Json2Csv.new(Object.new)
      converter.csv_from(@data).lines.to_a.first.chomp
        .must_equal("name,description")
      converter.csv_from(@data).lines.to_a.last.chomp
        .must_equal("bogus name,bogus description")
    end
  end #csv_from

  describe '#csv_header_from' do
    it 'generates a CSV header from parsed JSON data' do
      converter = Json2Csv.new(Object.new)
      converter.csv_header_from(@data).must_equal "name,description"
    end
  end #csv_header_from

  describe '#csv_rows_from' do
    it 'generates CSV rows from parsed JSON data' do
      converter = Json2Csv.new(Object.new)
      converter.csv_rows_from(@data)
        .must_equal "bogus name,bogus description"
    end
  end

  describe '#transform' do
    it 'generates a row from a parse JSON record' do
      converter = Json2Csv.new(Object.new)
      converter.transform(@data.first)
        .must_equal "bogus name,bogus description"
    end
  end #transform

  describe '#complex?' do
    it 'returns true if parse JSON data has nested arrays' do
      converter = Json2Csv.new(Object.new)
      converter.complex?([@data]).must_equal true
      converter.complex?(@data).must_equal false
    end
  end

  describe '#converted_filepath' do
    it 'returns the .csv filepath for a .json filepath' do
      converter = Json2Csv.new('/var/tmp/foo.json')
      converter.converted_filepath.must_equal '/var/tmp/foo.csv'
    end
  end #converted_filepath

  describe '#parse' do
    it 'returns parsed data from a JSON file' do
      filepath  = json_factory
      converter = Json2Csv.new(filepath)
      data = converter.parse(filepath)
      data.first.keys.must_include 'name'
    end
  end

  def json_factory
    data = [{
      name:         'bogus name',
      description:  'bogus description'
    }].to_json

    filepath = "/var/tmp/importer_#{Time.now.to_f}.json"
    File.open(filepath, 'w') { |file| file << data }

    filepath
  end #json_factory
end # Json2csv

