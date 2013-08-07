# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'fileutils'
require_relative '../../lib/importer/csv_normalizer'

include CartoDB::Importer2

describe CsvNormalizer do
  describe '#normalize' do
    it 'transforms the file using a proper comma delimiter' do
      fixture = tab_delimiter_factory
      csv     = CsvNormalizer.new(fixture)
      csv.delimiter.must_equal "\t"
      csv.normalize
      csv.delimiter.must_equal ','
    end
  end #normalize

  describe '#temporary_directory' do
    it 'generates a temporary directory' do
    end 
  end #temporary_directory

  describe '#delimiter' do
    it 'guesses the delimiter' do
      fixture = tab_delimiter_factory
      csv     = CsvNormalizer.new(fixture)
      csv.delimiter.must_equal "\t"

      FileUtils.rm(fixture)
    end
  end #delimiter

  describe '#encoding' do
    it 'guesses the encoding' do
      fixture = utf16le_factory
      csv     = CsvNormalizer.new(fixture)
      csv.encoding.must_equal 'ISO-8859-1'

      FileUtils.rm(fixture)
    end
  end #encoding

  def utf16le_factory
    filepath = "/var/tmp/#{Time.now.to_f}-#{rand(999)}.csv"

    ::CSV.open(filepath, 'wb', encoding: 'ISO-8859-1', col_sep: "\t") do |csv|
      csv << (["name", "description", "wadus"].map  { |s| s.encode('ISO-8859-1') })
      csv << (["bogus_1", "bogus_2", "bogus_3"].map { |s| s.encode('ISO-8859-1') })
    end

    filepath
  end #utf16le_factory

  def tab_delimiter_factory
    filepath = "/var/tmp/#{Time.now.to_f}-#{rand(999)}.csv"

    ::CSV.open(filepath, 'w', col_sep: "\t") do |csv|
      csv << ["name", "description", "wadus"]
      csv << ["bogus_1", "bogus_2", "bogus_3"]
    end

    filepath
  end #tab_delimiter_factory
end # CsvNormalizer

