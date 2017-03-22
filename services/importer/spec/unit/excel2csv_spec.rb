# encoding: utf-8

require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'
require_relative '../../lib/importer/excel2csv'
require_relative '../../../../spec/rspec_configuration.rb'
require_relative '../doubles/job'
require_relative '../doubles/csv_normalizer'

include Mocha::ParameterMatchers

describe CartoDB::Importer2::Excel2Csv do
  before(:each) do
    CartoDB.stubs(:python_path).returns('')
    CartoDB.stubs(:python_bin_path).returns(`which python`.strip)
  end

  describe '#excel2csv' do
    before(:each) do
      @job            = CartoDB::Importer2::Doubles::Job.new
      @csv_normalizer = CartoDB::Importer2::Doubles::CsvNormalizer.new
    end

    describe '#run' do
      it "parse xls file to csv" do
        filepath = path_to('fixture_20150714.xls')
        @excel2csv      = CartoDB::Importer2::Excel2Csv.new("xls", filepath, @job, @csv_normalizer)
        @excel2csv.stubs(:converted_filepath).returns("/tmp/converted_filepath_excel2csv")
        @excel2csv.run
      end
      it "parse xlsx file to csv" do
        filepath = path_to('fixture_20150714.xlsx')
        @excel2csv      = CartoDB::Importer2::Excel2Csv.new("xlsx", filepath, @job, @csv_normalizer)
        @excel2csv.stubs(:converted_filepath).returns("/tmp/converted_filepath_excel2csv")
        @excel2csv.run
      end
      it "raise if a csv file is passed as xls" do
        filepath = path_to('csv_as_xls.xls')
        @excel2csv      = CartoDB::Importer2::Excel2Csv.new("xls", filepath, @job, @csv_normalizer)
        @excel2csv.stubs(:converted_filepath).returns("/tmp/converted_filepath_excel2csv")
        expect { @excel2csv.run }.to raise_error CartoDB::Importer2::MalformedXLSException
      end
      it "raise if a csv file is passed as xlsx" do
        filepath = path_to('csv_as_xlsx.xlsx')
        @excel2csv      = CartoDB::Importer2::Excel2Csv.new("xlsx", filepath, @job, @csv_normalizer)
        @excel2csv.stubs(:converted_filepath).returns("/tmp/converted_filepath_excel2csv")
        expect { @excel2csv.run }.to raise_error CartoDB::Importer2::MalformedXLSException
      end
    end
  end
  def path_to(filename)
    File.join(File.dirname(__FILE__), '..', 'fixtures', filename)
  end
end
