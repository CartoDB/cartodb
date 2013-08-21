# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'csv'
require 'simple_xlsx_reader'
require_relative '../../lib/importer/xlsx2csv'

include CartoDB::Importer2

describe Xlsx2Csv do
  describe '#run' do
    it 'converts a XLSSX file to CSV' do
      skip
      fixture   = path_to('ngos.xlsx')
      xlsx2csv  = Xlsx2Csv.new(fixture)

      xlsx2csv.run

      xlsx_rows = xlsx2csv.xlsx.sheets.first.rows.count
      csv       = xlsx2csv.converted_filepath
      csv_rows  = CSV.parse(File.read(csv)).length

      csv_rows.must_equal xlsx_rows

      FileUtils.rm(xlsx2csv.converted_filepath)
    end
  end #run

  def path_to(filepath)
    File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
  end #path_to
end # Xlsx2Csv

