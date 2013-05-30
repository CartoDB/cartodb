# encoding: utf-8
require 'minitest/autorun'
require_relative '../../ogr2ogr'

include CartoDB

describe Importer::Ogr2ogr do
  describe '#initialize' do
    it 'requires a filepath' do
      lambda { Importer::Ogr2ogr.new }.must_raise ArgumentError
    end
  end #initialize

  describe '#executable_path' do
    it 'returns the path to the ogr2ogr binary' do
      job_id    = rand(999)
      filepath  = '/var/tmp/foo.txt'
      wrapper   = Importer::Ogr2ogr.new(filepath, job_id)

      wrapper.executable_path.must_match /ogr2ogr/
    end
  end #executable_path 
end # Importer::Ogr2ogr

