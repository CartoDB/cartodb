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
      Boolean   :derived
      String    :tags
    end

    repository  = Visualization::Repository.new(db)
    Visualization.default_repository = repository
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
end # Visualization::Repository
