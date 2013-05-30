# encoding: utf-8
require 'minitest/autorun'
require 'sqlite3'
require_relative '../../loader'

include CartoDB

describe Importer::Loader do
  describe '#run' do
    it 'logs the database connection used' do
      environment = environment_factory
      loader      = Importer::Loader.new(environment)
      loader.run
      environment.logger.to_s.must_match /#{environment.connection}/
    end

    it 'runs the ogr2ogr command to load the file' do
      ogr2ogr = Minitest::Mock.new
      loader  = Importer::Loader.new(environment_factory, ogr2ogr)

      ogr2ogr.expect(:run, 0, [])
      loader.run
      ogr2ogr.verify
    end
  end #run

  def environment_factory
    environment = OpenStruct.new(
      connection: SQLite3::Database.new(":memory:"),
      filepath:   '/var/tmp/foo.txt',
      job_id:     rand(999),
      logger:     TrackRecord::Log.new
    )

    def environment.log(*args)
      logger.append(*args);
    end #log
    environment
  end #environment_factory
end # Importer::Loader

