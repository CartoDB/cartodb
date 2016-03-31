# encoding: utf-8

require 'fileutils'
require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/csv_normalizer'
require_relative '../doubles/log'
require_relative '../doubles/user'

include CartoDB::Importer2::Doubles

describe CartoDB::Importer2::CsvNormalizer do

  BUG_COLUMNS_WRONG_SPLIT_FIXTURE_FILE = "#{File.dirname(__FILE__)}/bug_columns_wrong_split.csv"

  before(:all) do
    @user = FactoryGirl.create(:user)
  end
  describe '#run' do
    it 'transforms the file using a proper comma delimiter' do
      fixture = tab_delimiter_factory
      csv     = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))

      csv.detect_delimiter

      csv.delimiter.should eq "\t"
      csv.run
      csv.delimiter.should eq ','
    end
    it 'raise if detects an empty file' do
      fixture = empty_file_factory

      csv     = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))
      expect {
        csv.run
      }.to raise_exception CartoDB::Importer2::EmptyFileError

      FileUtils.rm(fixture)
    end
  end

  describe '#detect_delimiter' do
    it 'detects the delimiter' do
      fixture = tab_delimiter_factory
      csv     = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))
      csv.detect_delimiter.should eq "\t"

      FileUtils.rm(fixture)
    end

    it 'detects it correctly even with quoted strings containing delimiters' do
      fixture = quoted_string_with_delimiter_factory
      csv = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))
      csv.detect_delimiter.should eq ','
    end

    it 'detects it correctly with escaped quotes' do
      fixture = string_with_escaped_quote_factory
      csv = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))
      csv.detect_delimiter.should eq ','
    end

    it 'detects it correctly with triple quotes, quoted strings and all' do
      fixture = bug_columns_wrong_split_factory
      csv = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))
      csv.detect_delimiter.should eq ','
    end

  end

  describe '#encoding' do
    it 'guesses the encoding' do
      fixture = utf16le_factory
      csv     = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))
      csv.encoding.should eq 'ISO-8859-1'

      FileUtils.rm(fixture)
    end
  end

  describe '#encoding_fuzzy' do
    it 'guesses the encoding of an ISO-8859-1 with a problematic character' do
      csv = CartoDB::Importer2::CsvNormalizer.new(File.join(File.dirname(__FILE__), '../fixtures/charlock_holmes_utf_8_instead_of_iso.csv'), Log.new(@user))
      csv.encoding.should eq 'ISO-8859-1'
    end
  end

  describe '#encoding_utf8' do
    it 'guesses UTF-8 encoding' do
      fixture = utf8_factory
      csv     = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))
      csv.encoding.should eq 'UTF-8'

      FileUtils.rm(fixture)
    end
  end

  describe '#single_column?' do
    it 'returns true if CSV header has only one column' do
      fixture = single_column_factory
      csv     = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))
      csv.detect_delimiter

      csv.single_column?.should eq true

      fixture = tab_delimiter_factory
      csv     = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))
      csv.detect_delimiter

      csv.single_column?.should eq false
    end
  end

  describe '#multiple_column' do
    it 'returns the passed row if it has more than one cell' do
      fixture = tab_delimiter_factory
      row     = ['bogus', 'wadus']
      csv     = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))
      csv.multiple_column(row).should eq row
    end

    it 'adds an empty cell to the row if it has a single cell' do
      fixture = tab_delimiter_factory
      row     = ['bogus', 'wadus']
      csv     = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))
      csv.multiple_column(row).should eq (row << nil)
    end
  end

  describe '#spaces_and_commas_delimiter_detector' do
    it 'properly detects delimiter on a CSV containing many spaces and commas' do
      # Also tests that detector is able to load a file with less rows than CartoDB::Importer2::CsvNormalizer::LINES_FOR_DETECTION
      fixture = spaces_and_commas_factory
      csv     = CartoDB::Importer2::CsvNormalizer.new(fixture, Log.new(@user))

      csv.detect_delimiter.should eq ","

      FileUtils.rm(fixture)
    end
  end

  describe '#remove_newlines' do
    it 'tests the cleaning of non row-separating newlines inside CSVs' do
      fixture_filepath = newlines_factory

      csv = CartoDB::Importer2::CsvNormalizer.new(fixture_filepath, Log.new(@user))

      expect {
        csv.run
      }.to raise_exception CartoDB::Importer2::MalformedCSVException

      FileUtils.rm(fixture_filepath)
    end
  end

  # Helpers

  def newlines_factory
    invalid_content = "field1,\"field\n2\",field3\na,b,c\na2,\"b\n2\",c2\na3,b3,c3\na4,\"\nb\n4\n\",\"c\n4\""

    filepath = get_temp_csv_fullpath

    File.open(filepath, 'wb') do |f2|  
      f2.puts invalid_content
    end  

    return filepath
  end

  def utf8_factory
    filepath = get_temp_csv_fullpath

    ::CSV.open(filepath, 'wb', col_sep: "\t") do |csv|
      csv << ["name", "description", "field_3"]
      csv << ["normal 1 1 ", "normal 1 2", "normal 1 3"]
      csv << ["normal 2 1", "normal 2 2", "normal 2_3"]
      csv << ["normal 3 1", "normal 3 2", "normal 3 3"]
      csv << (["áÁéÉíÍ", "óÓúÚ", "ñÑ"].map { |s| s.encode('UTF-8') })
      csv << ["normal 5 1", "normal 5 2", "normal 5 3"]
    end

    filepath
  end

  def spaces_and_commas_factory
    filepath = get_temp_csv_fullpath

      ::CSV.open(filepath, 'wb', col_sep: ",") do |csv|
          csv << ["name", "description", "field_3"]
          csv << ["normal 1 1 .", "normal 1 2 .", "normal 1 3 ."]
          csv << ["normal 2 1", "normal 2 2", "normal 2 3"]
          csv << ["normal 3 1 .", "normal 3 2 .", "normal 3 3 ."]
          csv << ["normal 4 1", "normal 4 2", "normal 4 3"]
          csv << ["normal 5 1 . . ", "normal 5 2 . . ", "normal 5 3 . . "]
      end

      filepath
  end

  def utf16le_factory
    filepath = get_temp_csv_fullpath

    ::CSV.open(filepath, 'wb', col_sep: "\t") do |csv|
      csv << (["name", "description", "wadus"].map  { |s| s.encode('ISO-8859-1') })
      csv << (["bogus_1", "bogus_2", "bogus_3"].map { |s| s.encode('ISO-8859-1') })
    end

    filepath
  end

  def tab_delimiter_factory
    filepath = get_temp_csv_fullpath

    ::CSV.open(filepath, 'w', col_sep: "\t") do |csv|
      csv << ["name", "description", "wadus"]
      csv << ["bogus_1", "bogus_2", "bogus_3"]
    end

    filepath
  end

  def single_column_factory
    filepath = get_temp_csv_fullpath

    ::CSV.open(filepath, 'w') do |csv|
      csv << ['header_1']
      csv << ['row 1']
    end

    filepath
  end

  def empty_file_factory
    filepath = get_temp_csv_fullpath

    FileUtils.touch(filepath)

    filepath
  end

  def quoted_string_with_delimiter_factory
    filepath = get_temp_csv_fullpath

    ::File.open(filepath, 'w') do |file|
      file << 'name,description ; with semicolon,wadus' << "\n"
      file << 'foo,"this description contains; a semicolon and a, comma to affect frequency table",bar' << "\n"
      file << 'foobar,"this description contains; a semicolon but no comma",barfoo' << "\n"
    end

    filepath
  end

  def string_with_escaped_quote_factory
    filepath = get_temp_csv_fullpath

    ::File.open(filepath, 'w') do |file|
      file << 'name,description ; with semicolon,wadus' << "\n"
      file << 'foo,"this description contains an escaped \" quote; a semicolon, and a comma",bar' << "\n"
      file << 'foobar,"this description contains \"; a semicolon but no comma",barfoo' << "\n"
    end

    filepath
  end

  def bug_columns_wrong_split_factory
    temp_destination = get_temp_csv_fullpath

    ::FileUtils::copy BUG_COLUMNS_WRONG_SPLIT_FIXTURE_FILE, temp_destination

    temp_destination
  end




  def get_temp_csv_fullpath
    "/var/tmp/#{Time.now.to_f}-#{rand(999)}.csv"
  end

end

