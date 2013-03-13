# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../app/models/visualization/collection'

include CartoDB

describe Visualization::Collection do
  describe '#initialize' do
    it 'sets a default data repository if none passed' do
      Visualization.default_repository = DataRepository::Repository.new
      collection  = Visualization::Collection.new
      collection.send(:repository)
        .must_be_same_as Visualization.default_repository
    end

    it 'uses the passed data repository' do
      repository  = DataRepository::Repository.new
      collection  = Visualization::Collection.new({}, nil, repository)
      collection.send(:repository)
        .wont_be_same_as Visualization.default_repository
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

  describe '#each' do
    it 'yields members of the collection as OpenStruct by default' do
      member      = OpenStruct.new(id: 1)
      collection  = Visualization::Collection.new
      collection.add(member)
      collection.store

      rehydrated_collection = Visualization::Collection.new(id: collection.id)
      rehydrated_collection.fetch
      rehydrated_collection.to_a.first.must_be_instance_of OpenStruct
    end

    it 'yields members of the collection as the initialized member_class' do
      dummy_class = Class.new do
        attr_reader :id

        def initialize(attributes={})
          @id = attributes.fetch(:id)
        end #initialize
      end

      member      = dummy_class.new(id: 1)
      collection  = Visualization::Collection.new
      collection.add(member)
      collection.store

      rehydrated_collection = 
        Visualization::Collection.new({ id: collection.id }, dummy_class)
      rehydrated_collection.fetch
      rehydrated_collection.to_a.first.must_be_instance_of dummy_class
    end

    it 'returns an enumerator if no block given' do
      member      = OpenStruct.new(id: 1)
      collection  = Visualization::Collection.new
      collection.add(member)
      collection.store

      rehydrated_collection = Visualization::Collection.new(id: collection.id)
      rehydrated_collection.fetch

      enumerator = rehydrated_collection.each
      enumerator.next.must_be_instance_of OpenStruct
    end
  end #each

  describe '#fetch' do
    it 'resets the collection with data from the data repository' do
      member1     = OpenStruct.new(id: 1)
      member2     = OpenStruct.new(id: 2)
      collection  = Visualization::Collection.new
      collection.add(member1)
      collection.store

      rehydrated_collection = Visualization::Collection.new(id: collection.id)
      rehydrated_collection.add(member2) 

      rehydrated_collection.to_a.must_include(member2)
      rehydrated_collection.to_a.wont_include(member1)
      rehydrated_collection.fetch
      rehydrated_collection.to_a.must_include(member1)
      rehydrated_collection.to_a.wont_include(member2)
    end

    it 'empties the collection if it was not persisted to the repository' do
      member     = OpenStruct.new(id: 1)
      collection  = Visualization::Collection.new
      collection.add(member)
      collection.to_a.length.must_equal 1
      collection.fetch
      collection.to_a.must_be_empty
    end
  end #fetch

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

  describe '#to_json' do
    it 'renders a JSON representation of the collection' do
      dummy_class = Class.new do
        def initialize(attributes={}); @id = attributes.fetch(:id); end
        def id; @id; end
        def to_hash; { id: self.id }; end
        def fetch; self; end
      end

      member      = dummy_class.new(id: 1)
      collection  = Visualization::Collection.new({}, dummy_class)
      collection.add(member)
      collection.store

      representation = JSON.parse(collection.to_json)
      representation.size.must_equal 1
      representation.first.fetch('id').must_equal member.id
    end
  end #to_json
end # Visualization::Collection

