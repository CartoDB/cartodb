# encoding: utf-8
require 'fileutils'
require 'json'
require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/json2csv'
require_relative '../../../../services/importer/spec/doubles/log'

include CartoDB::Importer2

describe Json2Csv do
  before do
    @data = [{ name: 'bogus name', description: 'bogus description' }]
    @user = create_user
  end

  def json2csv_instance(filepath)
    Json2Csv.new(filepath, nil, CartoDB::Importer2::Doubles::Log.new(@user))
  end

  describe '#run' do
    it 'converts a JSON file to CSV' do
      filepath  = json_factory
      converter = json2csv_instance(filepath)
      converter.run

      data = File.open(converter.converted_filepath).readlines
      data.to_a.first.chomp.should eq 'name,description'
    end
  end #run

  describe '#csv_from' do
    it 'generates a CSV from parsed JSON data' do 
      converter = json2csv_instance(Object.new)
      converter.csv_from(@data).lines.to_a.first.chomp
        .should eq("name,description")
      converter.csv_from(@data).lines.to_a.last.chomp
        .should eq("bogus name,bogus description")
    end
  end #csv_from

  describe '#csv_header_from' do
    it 'generates a CSV header from parsed JSON data' do
      converter = json2csv_instance(Object.new)
      converter.csv_header_from(@data).should eq "name,description"
    end
  end #csv_header_from

  describe '#csv_rows_from' do
    it 'generates CSV rows from parsed JSON data' do
      converter = json2csv_instance(Object.new)
      converter.csv_rows_from(@data)
        .should eq "bogus name,bogus description"
    end
  end

  describe '#transform' do
    it 'generates a row from a parse JSON record' do
      converter = json2csv_instance(Object.new)
      converter.transform(@data.first)
        .should eq "bogus name,bogus description"
    end
  end #transform

  describe '#complex?' do
    it 'returns true if parse JSON data has nested arrays' do
      converter = json2csv_instance(Object.new)
      converter.complex?([@data]).should eq true
      converter.complex?(@data).should eq false
    end
  end

  describe '#converted_filepath' do
    it 'returns the .csv filepath for a .json filepath' do
      converter = json2csv_instance('/var/tmp/foo.json')
      converter.converted_filepath.should eq '/var/tmp/foo.csv'
    end
  end #converted_filepath

  describe '#parse' do
    it 'returns parsed data from a JSON file' do
      filepath  = json_factory
      converter = json2csv_instance(filepath)
      data = converter.parse(filepath)
      data.first.keys.should include 'name'
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

