# encoding: utf-8
require 'minitest/autorun'
require_relative '../../job'

include CartoDB

describe Importer::Job do
  describe '#initialize' do
    it 'requires a db connection and the path to a file' do
      lambda { Importer::Job.new }.must_raise ArgumentError
      lambda { Importer::Job.new '/var/tmp/foo.txt' }.must_raise ArgumentError
    end
  end #initialize

  describe '#run' do
    it 'returns 0 if successful' do
      connection  = SQLite3::Database.new ":memory:"
      filepath    = '/var/tmp/foo.txt'

      importer    = Importer::Job.new(connection, filepath)
      importer.run.must_equal 0
    end

    it 'logs the database connection used' do
      connection  = SQLite3::Database.new ":memory:"
      filepath    = '/var/tmp/foo.txt'

      importer    = Importer::Job.new(connection, filepath)
      importer.run
      importer.log.to_s.must_match /#{connection}/
    end

    it 'logs the file path to be importer' do
      connection  = SQLite3::Database.new ":memory:"
      filepath    = '/var/tmp/foo.txt'

      importer    = Importer::Job.new(connection, filepath)
      importer.run
      importer.log.to_s.must_match %r{#{filepath}}
    end
  end #run
end # Importer::Job

