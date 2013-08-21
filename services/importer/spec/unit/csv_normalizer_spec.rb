# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'fileutils'
require_relative '../../lib/importer/csv_normalizer'

include CartoDB::Importer2

describe CsvNormalizer do
  describe '#run' do
    it 'transforms the file using a proper comma delimiter' do
      fixture = tab_delimiter_factory
      csv     = CsvNormalizer.new(fixture)
      csv.delimiter.must_equal "\t"
      csv.run
      csv.delimiter.must_equal ','
    end
  end #run

  describe '#temporary_directory' do
    it 'generates a temporary directory' do
      skip
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

  describe '#single_column?' do
    it 'returns true if CSV header has only one column' do
      fixture = single_column_factory
      csv     = CsvNormalizer.new(fixture)
      csv.single_column?.must_equal true

      fixture = tab_delimiter_factory
      csv     = CsvNormalizer.new(fixture)
      csv.single_column?.must_equal false
    end
  end #single_column?

  describe '#multiple_column' do
    it 'returns the passed row if it has more than one cell' do
      fixture = tab_delimiter_factory
      row     = ['bogus', 'wadus']
      csv     = CsvNormalizer.new(fixture)
      csv.multiple_column(row).must_equal row
    end

    it 'adds an empty cell to the row if it has a single cell' do
      fixture = tab_delimiter_factory
      row     = ['bogus', 'wadus']
      csv     = CsvNormalizer.new(fixture)
      csv.multiple_column(row).must_equal(row << nil)
    end
  end #multiple_column

  def utf16le_factory
    filepath = "/var/tmp/#{Time.now.to_f}-#{rand(999)}.csv"

    ::CSV.open(filepath, 'wb', col_sep: "\t") do |csv|
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

  def single_column_factory
    filepath = "/var/tmp/#{Time.now.to_f}-#{rand(999)}.csv"
    ::CSV.open(filepath, 'w') do |csv|
      csv << ['header_1']
      csv << ['row 1']
    end

    filepath
  end #single_column_factory
end # CsvNormalizer

