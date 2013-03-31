# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../app/models/visualization/repository'
require_relative '../../../app/models/visualization/member'

include CartoDB

describe Visualization::Repository do
  before do
    db = Sequel.sqlite
    db.create_table :visualizations do
      String    :id
      String    :name
      String    :description
      String    :map_id
      String    :type
      String    :tags
    end

    Visualization.repository = 
      Visualization::Repository.new(:visualizations, db)
  end

  describe '#store' do
    it 'persists a visualization' do
      member = Visualization::Member.new(
        name: 'visualization 1',
        tags: ['foo', 'bar']
      )
      member.store

      rehydrated_member = Visualization::Member.new(id: member.id)
      rehydrated_member.fetch
      rehydrated_member.name.must_equal member.name

    end
  end #store

  describe '#fetch' do
  end #fetch

  describe '#delete' do
    it 'deletes a visualization from persistence' do
      member = Visualization::Member.new(
        name: 'visualization 1',
        tags: ['foo', 'bar']
      )
      member.store

      id = member.id
      Visualization.repository.fetch(id).wont_be_nil
      member.delete
      Visualization.repository.fetch(id).must_be_nil
    end
  end #delete

  describe '#collection' do
    it 'gets a collection of records using the passed filter' do
      member1 = Visualization::Member.new(
        name:   'visualization 1',
        map_id: 1
      ).store
      member2 = Visualization::Member.new(
        name: 'visualization 2',
        map_id: 1
      ).store

      records = Visualization.repository.collection(map_id: 1)
      records.to_a.size.must_equal 2
    end
  end #collection
end # Visualization::Repository

