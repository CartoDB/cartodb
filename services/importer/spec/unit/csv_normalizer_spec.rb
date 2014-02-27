# encoding: utf-8
require 'fileutils'
require_relative '../../lib/importer/csv_normalizer'

include CartoDB::Importer2

describe CsvNormalizer do
  
  describe '#run' do
    it 'transforms the file using a proper comma delimiter' do
      fixture = tab_delimiter_factory
      csv     = CsvNormalizer.new(fixture)

      csv.detect_delimiter

      csv.delimiter.should eq "\t"
      csv.run
      csv.delimiter.should eq ','
    end
  end #run

  describe '#detect_delimiter' do
    it 'detects the delimiter' do
      fixture = tab_delimiter_factory
      csv     = CsvNormalizer.new(fixture)
      csv.detect_delimiter.should eq "\t"

      FileUtils.rm(fixture)
    end
  end #delimiter

  describe '#encoding' do
    it 'guesses the encoding' do
      fixture = utf16le_factory
      csv     = CsvNormalizer.new(fixture)
      csv.encoding.should eq 'ISO-8859-1'

      FileUtils.rm(fixture)
    end
  end #encoding

  describe '#encoding_utf8' do
    it 'guesses UTF-8 encoding' do
      fixture = utf8_factory
      csv     = CsvNormalizer.new(fixture)
      csv.encoding.should eq 'UTF-8'

      FileUtils.rm(fixture)
    end
  end #encoding_utf8

  describe '#single_column?' do
    it 'returns true if CSV header has only one column' do
      fixture = single_column_factory
      csv     = CsvNormalizer.new(fixture)
      csv.detect_delimiter

      csv.single_column?.should eq true

      fixture = tab_delimiter_factory
      csv     = CsvNormalizer.new(fixture)
      csv.detect_delimiter

      csv.single_column?.should eq false
    end
  end #single_column?

  describe '#multiple_column' do
    it 'returns the passed row if it has more than one cell' do
      fixture = tab_delimiter_factory
      row     = ['bogus', 'wadus']
      csv     = CsvNormalizer.new(fixture)
      csv.multiple_column(row).should eq row
    end

    it 'adds an empty cell to the row if it has a single cell' do
      fixture = tab_delimiter_factory
      row     = ['bogus', 'wadus']
      csv     = CsvNormalizer.new(fixture)
      csv.multiple_column(row).should eq (row << nil)
    end
  end #multiple_column

  describe '#spaces_and_commas_delimiter_detector' do
    it 'properly detects delimiter on a CSV containing many spaces and commas' do
      # Also tests that detector is able to load a file with less rows than CsvNormalizer::LINES_FOR_DETECTION
      fixture = spaces_and_commas_factory
      csv     = CsvNormalizer.new(fixture)

      csv.detect_delimiter.should eq ","

      FileUtils.rm(fixture)
    end
  end #spaces_and_commas_delimiter_detector

  describe '#remove_newlines' do
    it 'tests the cleaning of non row-separating newlines inside CSVs' do
      fixture_filepath, expected_content = newlines_factory()

      csv = CsvNormalizer.new(fixture_filepath)

      temporary_filepath = csv.remove_newlines(get_temp_csv_fullpath())

      line_num = 0
      File.open(temporary_filepath, 'r')
          .each_line { |line| 
            line.should eq expected_content[line_num]
            line_num += 1
      }

      FileUtils.rm(fixture_filepath)
    end
  end #remove_newlines


  # Helpers

  def newlines_factory
    invalid_content = "field1,field2,field3\na,b,c\na2,\"b\n2\",c2\na3,b3,c3\na4,\"\nb\n4\n\",\"c\n4\""
    valid_content = [ "field1,field2,field3\n", "a,b,c\n", "a2,\"b2\",c2\n", "a3,b3,c3\n", "a4,\"b4\",\"c4\"\n" ]

    filepath = get_temp_csv_fullpath()

    File.open(filepath, 'wb') do |f2|  
      f2.puts invalid_content
    end  

    return filepath, valid_content
  end #newlines_factory

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
  end #utf8_factory

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
  end #spaces_and_commas_factory

  def utf16le_factory
    filepath = get_temp_csv_fullpath

    ::CSV.open(filepath, 'wb', col_sep: "\t") do |csv|
      csv << (["name", "description", "wadus"].map  { |s| s.encode('ISO-8859-1') })
      csv << (["bogus_1", "bogus_2", "bogus_3"].map { |s| s.encode('ISO-8859-1') })
    end

    filepath
  end #utf16le_factory

  def tab_delimiter_factory
    filepath = get_temp_csv_fullpath

    ::CSV.open(filepath, 'w', col_sep: "\t") do |csv|
      csv << ["name", "description", "wadus"]
      csv << ["bogus_1", "bogus_2", "bogus_3"]
    end

    filepath
  end #tab_delimiter_factory

  def single_column_factory
    filepath = get_temp_csv_fullpath

    ::CSV.open(filepath, 'w') do |csv|
      csv << ['header_1']
      csv << ['row 1']
    end

    filepath
  end #single_column_factory

  def get_temp_csv_fullpath
    "/var/tmp/#{Time.now.to_f}-#{rand(999)}.csv"
  end #get_temp_csv_fullpath

end # CsvNormalizer

