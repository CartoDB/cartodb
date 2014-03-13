# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../backend/sequel'
require_relative '../../../../../app/models/visualization/member'

include CartoDB

describe DataRepository::Backend::Sequel do
  before do
    db = Sequel.sqlite
    db.create_table :visualizations do
      String    :id, primary_key: true
      String    :name
      String    :description
      String    :tags
      String   :map_id
      String   :active_layer_id
      String    :type
      String    :privacy
      String    :encrypted_password
      String    :password_salt
    end

    db.create_table :overlays do
      String    :id,                null: false, primary_key: true
      Integer   :order,             null: false
      String    :options,           text: true
      String    :type
      String    :visualization_id,  index: true
    end

    Visualization.repository = 
      DataRepository::Backend::Sequel.new(db, :visualizations)
    Overlay.repository = 
      DataRepository::Backend::Sequel.new(db, :overlays)
  end

  describe '#store' do
    it 'inserts a visualization' do
      member = Visualization::Member.new(
        name: 'visualization 1',
        tags: ['foo', 'bar']
      )
      member.store

      rehydrated_member = Visualization::Member.new(id: member.id)
      rehydrated_member.fetch
      rehydrated_member.name.must_equal member.name
    end

    it 'updates the visualization if existing' do
      member = Visualization::Member.new(
        name: 'visualization 1',
        tags: ['foo', 'bar']
      )
      member.store
      Visualization.repository.collection(id: member.id).to_a.size
        .must_equal 1

      member.store
      Visualization.repository.collection(id: member.id).to_a.size
        .must_equal 1

      Visualization::Member.new(id: member.id).fetch.store
      Visualization.repository.collection(id: member.id).to_a.size
        .must_equal 1
    end
  end #store

  describe '#fetch' do
  end #fetch

  describe '#delete' do
    it 'deletes a visualization from persistence' do
      member = Visualization::Member.new(
        name: 'visualization 1',
        tags: ['foo', 'bar']
      ).store

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

