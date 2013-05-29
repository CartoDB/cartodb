# encoding: utf-8
require 'minitest/autorun'
require 'sqlite3'
require_relative '../../loader'

include CartoDB

describe Importer::Loader do
  describe '#run' do
    it 'logs the database connection used' do
      connection  = connection_factory
      filepath    = '/var/tmp/foo.txt'

      loader      = Importer::Loader.new(connection)
      loader.run
      loader.log.to_s.must_match /#{connection}/
    end

    it 'runs the ogr2ogr command to load the file' do
      connection  = connection_factory
      filepath    = '/var/tmp/foo.txt'
      ogr2ogr     = Minitest::Mock.new

      loader      = Importer::Loader.new(connection, nil, ogr2ogr)
      ogr2ogr.expect(:run, 0, [])
      loader.run
      ogr2ogr.verify
    end
  end #run

  def connection_factory
    SQLite3::Database.new ":memory:"
  end #connection_factory
end # Importer::Loader

