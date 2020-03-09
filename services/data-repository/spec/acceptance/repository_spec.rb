require 'minitest/autorun'
require 'redis'
require_relative '../spec_helper'
require_relative '../../repository'

describe DataRepository do
  describe 'DataRepository.new' do
    it 'instantiates a repository with a memory backend' do
      repository = DataRepository.new
      repository.must_be_instance_of DataRepository::Repository
      repository.backend.must_be_instance_of DataRepository::Backend::Memory
    end

    it 'detects the backend if a repository or DB connection is passed' do
      repository = DataRepository.new(Redis.new)
      repository.must_be_instance_of DataRepository::Repository
      repository.backend.must_be_instance_of DataRepository::Backend::Redis
    end
  end # DataRepository.new 
end # DataRepository

