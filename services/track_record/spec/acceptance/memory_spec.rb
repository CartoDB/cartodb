# encoding: utf-8
require 'minitest/autorun'

describe 'example use case with an in-memory backend' do
  it 'should append entries to a log' do
    require_relative '../../../data-repository/handler'
    require_relative '../../log'
    
    backend         = DataRepository::Backend::Memory.new
    repository      = DataRepository::Handler.new(backend)
    log             = TrackRecord::Log.new(repository: repository)

    log.append(message: 'sample message')

    rehydrated_log  = TrackRecord::Log.new(id: log.id, repository: repository)
    rehydrated_log.fetch.to_s.must_match /sample/
  end
end

