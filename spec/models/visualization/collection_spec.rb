# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../app/models/visualization/collection'

include CartoDB

describe Visualization::Collection do
  describe '#initialize' do
    it 'sets a default data repository if none passed' do
      Visualization.default_repository = DataRepository::Repository.new
      collection = Visualization::Collection.new
      collection.send(:repository)
        .must_be_same_as Visualization.default_repository
    end
  end #initialize

  describe '#add' do
    it 'adds a member to the collection' do
      member      = OpenStruct.new(id: 1)
      collection  = Visualization::Collection.new
      collection.add(member)
      collection.to_a.must_include member
    end
  end

  describe '#delete' do
    it 'deletes a member from the collection' do
      member      = OpenStruct.new(id: 1)
      collection  = Visualization::Collection.new
      collection.add(member)
      collection.delete(member)
      collection.to_a.wont_include member
    end
  end #delete

  describe '#fetch' do
  end

  describe '#store' do
    it 'persists the collection to the data repository' do
      member      = OpenStruct.new(id: 1)
      collection  = Visualization::Collection.new
      collection.add(member)
      collection.store

      rehydrated_collection = Visualization::Collection.new(id: collection.id)
      rehydrated_collection.fetch
      rehydrated_collection.map { |member| member.id }.must_include member.id
    end
  end #stsore

  describe '#each' do
    it 'yields members of the collection' do
      member      = OpenStruct.new(id: 1)
      collection  = Visualization::Collection.new
      collection.add(member)
      collection.each { |member| member.must_be_instance_of OpenStruct }
    end
  end #each
end # Visualization::Collection

