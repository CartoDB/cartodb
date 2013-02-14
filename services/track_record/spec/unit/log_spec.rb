# encoding: utf-8
require 'minitest/autorun'
require_relative '../spec_helper'
require_relative '../../track_record/log'
require_relative '../../../data-repository/backend/redis'

include TrackRecord

describe Log do
  describe 'Log.repository' do
    it 'returns the default data repository' do
      Log.repository.must_be_instance_of DataRepository::Repository
    end
  end # Log.repository

  describe 'Log.repository=' do
    it 'assigns the default data repository' do
      fake_repository = Object.new
      Log.repository  = fake_repository
      Log.repository.must_equal fake_repository
    end
  end # Log.repository=

  describe '#repository' do
    it 'returns the default Log.repository if none passed at initialization' do
      Log.repository = nil
      Log.new.repository.must_be_instance_of DataRepository::Repository
    end

    it "returns this object's repository if specified at initialization" do
      fake_repository = Object.new
      log             = Log.new(repository: fake_repository)

      log.repository.must_equal fake_repository
    end
  end #repository

  describe '#id' do

    it 'is assigned by default' do
      log = Log.new
      UUIDTools::UUID.parse(log.id).valid?.must_equal true
    end
  end #id

  describe '#append' do
    it 'adds a new entry to the log' do
      log = Log.new
      log.append(text: 'bogus message')
      log.map { |entry| entry.to_s }.join.must_match /bogus message/
    end

    it 'persists the log' do
      log = Log.new
      log.append(text: 'bogus message')

      log
      log.map { |entry| entry.to_s }.join.must_match /bogus message/
    end
  end #append

  describe '#each' do
    it 'yields entries sorted by their timestamp, in ascending order' do
      log = Log.new
      log.append(text: 'first message')
      log.append(text: 'second message')

      log.to_a.first.to_s .must_match /first/
      log.to_a.last.to_s  .must_match /second/
    end
  end #each

  describe '#to_s' do
    it 'renders a string representation of the log entries' do
      log = Log.new
      log.append(text: 'sample message')
      log.to_s.must_match /sample message/
    end
  end #to_s

  describe '#fetch' do
    it 'retrieves the entries from the repository' do
      repository = DataRepository::Repository.new

      log = Log.new(repository: repository)
      log.append(text: 'first message')
      
      rehydrated_log = Log.new(id: log.id, repository: repository)
      rehydrated_log.to_s.must_be_empty

      rehydrated_log.fetch
      rehydrated_log.to_s.must_match /first/

      log.append(text: 'second message')
      
      rehydrated_log.to_s.wont_match /second/
      rehydrated_log.fetch
      rehydrated_log.to_s.must_match /second/
    end

    it 'works with a Redis backend' do
      connection  = Redis.new
      connection.select 8
      connection.flushdb
      
      backend     = DataRepository::Backend::Redis.new(connection)
      repository  = DataRepository::Repository.new(backend)

      log = Log.new(repository: repository)
      log.append(text: 'first message')

      rehydrated_log = Log.new(id: log.id, repository: repository)
      rehydrated_log.fetch
      rehydrated_log.to_s.must_match /first/
    end
  end #fetch

  describe '#tail' do
    it 'returns the latest log entry' do
      log = Log.new
      log.append(text: 'latest entry')

      log.tail.to_s.must_match /latest/
    end

    it 'returns an empty array if log is empty' do
      log = Log.new
      log.tail.must_be_empty
    end
  end #latest
end # Log

