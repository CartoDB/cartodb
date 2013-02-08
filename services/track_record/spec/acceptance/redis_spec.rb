# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../data-repository/repository'
require_relative '../../../data-repository/backend/redis'
require_relative '../../track_record'

describe 'example usage with an in-memory backend' do
  it 'should append entries to a log' do
    
    connection  = Redis.new
    connection.select 8
    connection.flushdb

    backend     = DataRepository::Backend::Redis.new(connection)
    repository  = DataRepository::Repository.new(backend)
    log         = TrackRecord::Log.new(repository: repository)

    log.append(message: 'sample message')

    rehydrated_log  = TrackRecord::Log.new(id: log.id, repository: repository)
    rehydrated_log.repository   .must_equal log.repository
    rehydrated_log.fetch.to_s.must_match /sample/
  end

  it 'should reuse the default repository' do
    backend         = DataRepository::Backend::Redis.new(Redis.new)
    repository      = DataRepository::Repository.new(backend)

    TrackRecord::Log.repository = repository

    log         = TrackRecord::Log.new
    another_log = TrackRecord::Log.new

    another_log.repository.must_equal log.repository

    log.append(text: 'sample message')
    rehydrated_log = TrackRecord::Log.new(id: log.id)
    rehydrated_log.fetch

    rehydrated_log.repository   .must_equal log.repository
    rehydrated_log.to_s         .must_match /sample/
  end
end # example usage for a log with a redis backend

