# encoding: utf-8
require 'minitest/autorun'
require 'ostruct'
require_relative '../../spec_helper'
require_relative '../../../repository'
require_relative '../../../backend/memory'

include DataRepository

describe Repository do
  before do
    @repository = Repository.new(Backend::Memory.new)
  end

  describe '#store' do
    it 'persists a data structure in the passed key' do
      data  = { id: 5 }
      key   = data.fetch(:id)

      @repository.keys.wont_include key.to_s
      @repository.store(key, data)
      @repository.keys.must_include key.to_s
    end

    it 'stringifies symbols in the persisted data structure' do
      data  = { id: 5 }
      key   = data.fetch(:id)

      @repository.store(key, data)
      retrieved_data = @repository.fetch(key)

      retrieved_data.keys.wont_include :id
      retrieved_data.keys.must_include 'id'
    end
  end #store

  describe '#fetch' do
    it 'retrieves a data structure from a key' do
      data  = { id: 5 }
      key   = data.fetch(:id)

      @repository.store(key, data)
      retrieved_data = @repository.fetch(key.to_s)
      retrieved_data.fetch('id').must_equal data.fetch(:id)
    end
  end #fetch

  describe '#keys' do
    it 'returns all stored keys, stringified' do
      data  = { id: 5 }
      key   = data.fetch(:id)

      @repository.store(key, data)
      @repository.keys.must_equal [key.to_s]
    end
  end #keys
end # Repository

