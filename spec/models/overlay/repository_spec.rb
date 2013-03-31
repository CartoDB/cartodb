# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../app/models/overlay/repository'
require_relative '../../../app/models/overlay/member'

include CartoDB

describe Overlay::Repository do
  before do
    db = Sequel.sqlite
    db.create_table :overlays do
      String    :id,      null: false
      Integer   :order
      String    :type
      String    :options, text: true
      String    :visualization_id, index: true
    end

    repository  = Overlay::Repository.new(db)
    Visualization.default_repository = repository
  end

  describe '#store' do
    it 'persists a overlay' do
      member = Overlay::Member.new(type: 'bogus')
      member.store

      rehydrated_member = Overlay::Member.new(id: member.id)
      rehydrated_member.fetch
      rehydrated_member.type.must_equal member.type
    end
  end #store

  describe '#fetch' do
  end #fetch
end # Overlay::Repository

