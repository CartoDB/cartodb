require 'minitest/autorun'
require 'set'
require_relative '../../spec_helper'
require_relative '../../../backend/redis'
require_relative '../../../repository'

include DataRepository

describe Backend::Redis do
  before do
    @connection = Redis.new
    @connection.select 8
    @connection.flushdb

    storage     = Backend::Redis.new(@connection)
    @repository = Repository.new(storage)
  end

  describe '#store' do
    it 'persists a data structure in the passed key' do
      data  = { id: 5 }
      key   = data.fetch(:id)

      @repository.keys.wont_include key.to_s
      @repository.store(key, data)
      @repository.keys.must_include key.to_s

      set = Set.new
      set.add 1
      set.add 2

      @repository.store('bogus_key', set)
      @repository.fetch('bogus_key').must_be_kind_of Enumerable
    end

    it 'stringifies symbols in the persisted data structe' do
      data  = { id: 5 }
      key   = data.fetch(:id)

      @repository.store(key, data)
      retrieved_data = @repository.fetch(key)

      retrieved_data.keys.wont_include :id
      retrieved_data.keys.must_include 'id'
    end

    it 'sets key expiration in seconds if expiration option passed' do
      data        = { id: 5 }
      key         = data.fetch(:id)
      expiration  = 1
      
      @repository.store(key, data, expiration: expiration)
      retrieved_data = @repository.fetch(key)
      retrieved_data.keys.must_include 'id'
      @connection.get(key).wont_be_nil
      sleep(expiration.to_f + 1.0 / 1.0)
      @connection.get(key).must_be_nil
    end
  end #store

  describe '#fetch' do
    it 'retrieves a data structure from a key' do
      data  = { id: 5 }
      key   = data.fetch(:id)

      @repository.store(key, data)
      retrieved_data = @repository.fetch(key)
      
      retrieved_data.fetch('id').must_equal data.fetch(:id)
    end

    it 'returns nil if key does not exist' do
      @repository.fetch('non_existent_key').must_equal nil
    end
  end #fetch

  describe '#delete' do
    it 'deletes a key' do
      data  = { id: 5 }
      key   = data.fetch(:id)

      @repository.store(key, data)
      @repository.fetch(key).wont_be_nil

      @repository.delete(key)
      @repository.fetch(key).must_be_nil
    end
  end #delete

  describe '#keys' do
    it 'returns all stored keys, stringified' do
      data  = { id: 5 }
      key   = data.fetch(:id)

      @repository.store(key, data)
      @repository.keys.must_equal [key.to_s]
    end
  end #keys

  describe '#exists?' do
    it 'returns if key exists' do
      data  = { id: 5 }
      key   = data.fetch(:id)

      @repository.exists?(key.to_s).must_equal false
      @repository.store(key, data)
      @repository.exists?(key.to_s).must_equal true
    end
  end #exists?
end # Backend::Redis

