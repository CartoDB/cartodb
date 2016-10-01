# encoding: utf-8

require 'fileutils'
require_relative '../../lib/importer/shp_normalizer'
require_relative '../doubles/job'
require_relative '../../../../spec/rspec_configuration.rb'

include CartoDB::Importer2::Doubles

describe CartoDB::Importer2::ShpNormalizer do

  describe '#shape_encoding' do
    before(:each) do
      CartoDB.stubs(:python_bin_path).returns(`which python`.strip)
    end

    it 'guesses UTF-8 encoding for USA counties common data unzipped with cpg file' do
      job = CartoDB::Importer2::Doubles::Job.new
      job.stubs(:table_name).returns('county_usa')
      path = File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/county_usa/county_usa.shp"))
      shp_normalizer = CartoDB::Importer2::ShpNormalizer.new(path, job)

      shp_normalizer.shape_encoding.should eq 'UTF-8'
    end

    it 'guesses LATIN1 encoding for a "greek", unsupported encoding' do
      job = CartoDB::Importer2::Doubles::Job.new
      job.stubs(:table_name).returns('greek')
      path = File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/greek/greek.shp"))
      shp_normalizer = CartoDB::Importer2::ShpNormalizer.new(path, job)

      shp_normalizer.shape_encoding.should eq 'LATIN1'
    end

  end

end
