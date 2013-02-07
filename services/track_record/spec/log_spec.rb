# encoding: utf-8
require 'minitest/autorun'
require_relative '../log'
require_relative '../../data-repository/backend/redis'
require_relative '../../data-repository/backend/memory'

include TrackRecord

describe Log do
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
      repository = DataRepository::Handler.new

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
      repository  = DataRepository::Handler.new(backend)

      log = Log.new(repository: repository)
      log.append(text: 'first message')

      rehydrated_log = Log.new(id: log.id, repository: repository)
      rehydrated_log.fetch
      rehydrated_log.to_s.must_match /first/
    end
  end #fetch
end # Log

