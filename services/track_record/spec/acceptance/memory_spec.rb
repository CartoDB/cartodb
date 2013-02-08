# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../data-repository/repository'
require_relative '../../track_record'

describe 'example usage for a log with an in-memory backend' do
  it 'should append entries to a log' do
    repository  = DataRepository.new
    log         = TrackRecord::Log.new(repository: repository)

    log.append(message: 'sample message')
    rehydrated_log  = TrackRecord::Log.new(id: log.id, repository: repository)

    rehydrated_log.repository   .must_equal log.repository
    rehydrated_log.fetch.to_s   .must_match /sample/
  end

  it 'should reuse the default repository' do
    log         = TrackRecord::Log.new
    another_log = TrackRecord::Log.new

    another_log.repository.must_equal log.repository
    another_log.repository.must_equal TrackRecord::Log.repository

    log.append(text: 'sample message')   
    rehydrated_log = TrackRecord::Log.new(id: log.id)
    rehydrated_log.fetch

    rehydrated_log.repository   .must_equal log.repository
    rehydrated_log.to_s         .must_match /sample/
  end
end # example usage for a log with an in-memory backend

