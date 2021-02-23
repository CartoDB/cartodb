require 'spec_helper_min'
require 'minitest/autorun'
require_relative '../../../structures/collection'

include DataRepository

describe Collection do
  before do
    @repository = DataRepository::Repository.new
    @dummy_class = Class.new do
      attr_accessor :id
      def initialize(arguments={}); self.id = arguments.fetch(:id); end
      def fetch; self; end
      def to_hash; { id: id }; end
      def ==(other); id.to_s == other.id.to_s; end
    end

    @defaults = { repository: @repository, member_class: @dummy_class}
  end

  describe '#add' do
    it 'adds a member to the collection' do
      member      = @dummy_class.new(id: 1)
      collection  = Collection.new(@defaults)
      collection.add(member)
      collection.to_a.must_include member
    end
  end

  describe '#delete' do
    it 'deletes a member from the collection' do
      member      = @dummy_class.new(id: 1)
      collection  = Collection.new(@defaults)
      collection.add(member)
      collection.delete(member)
      collection.to_a.wont_include member
    end
  end #delete

  describe '#each' do
    it 'yields members of the collection as the initialized member_class' do
      member      = @dummy_class.new(id: 1)
      collection  = Collection.new(@defaults)
      collection.add(member)
      collection.store

      rehydrated_collection =
        Collection.new(@defaults.merge(signature: collection.signature))
      rehydrated_collection.fetch
      rehydrated_collection.to_a.first.must_be_instance_of @dummy_class
    end

    it 'returns an enumerator if no block given' do
      member      = @dummy_class.new(id: 1)
      collection  = Collection.new({ repository: @repository })
      collection.add(member)
      collection.store

      rehydrated_collection =
        Collection.new(@defaults.merge(signature: collection.signature))
      rehydrated_collection.fetch

      enumerator = rehydrated_collection.each
      enumerator.next.must_be_instance_of @dummy_class
    end
  end #each

  describe '#fetch' do
    it 'resets the collection with data from the data repository' do
      member1     = @dummy_class.new(id: 1)
      member2     = @dummy_class.new(id: 2)
      collection  = Collection.new(@defaults)
      collection.add(member1)
      collection.store

      rehydrated_collection =
        Collection.new(@defaults.merge(signature: collection.signature))
      rehydrated_collection.add(member2)

      rehydrated_collection.to_a.must_include(member2)
      rehydrated_collection.to_a.wont_include(member1)
      rehydrated_collection.fetch
      rehydrated_collection.to_a.must_include(member1)
      rehydrated_collection.to_a.wont_include(member2)
    end

    it 'empties the collection if it was not persisted to the repository' do
      member      = @dummy_class.new(id: 1)
      collection  = Collection.new(@defaults)
      collection.add(member)
      collection.to_a.length.must_equal 1
      collection.fetch
      collection.to_a.must_be_empty
    end
  end #fetch

  describe '#store' do
    it 'persists the collection to the data repository' do
      member      = @dummy_class.new(id: 1)
      collection  = Collection.new(@defaults)
      collection.add(member)
      collection.store

      rehydrated_collection =
        Collection.new(@defaults.merge(signature: collection.signature))
      rehydrated_collection.fetch
      rehydrated_collection.map { |member| member.id }.must_include member.id
    end
  end #store

  describe '#to_json' do
    it 'renders a JSON representation of the collection' do
      member      = @dummy_class.new(id: 1)
      collection  = Collection.new(@defaults)
      collection.add(member)
      collection.store

      representation = JSON.parse(collection.to_json)
      representation.size.must_equal 1
      representation.first.fetch('id').must_equal member.id
    end
  end #to_json
end # Collection
