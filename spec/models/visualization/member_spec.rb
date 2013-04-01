# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../app/models/visualization/member'
require_relative '../../../services/data-repository/repository'

include CartoDB

describe Visualization::Member do
  before do
    memory = DataRepository.new
    Visualization.repository  = memory
    Overlay.repository        = memory
  end

  describe '#initialize' do
    it 'assigns an id by default' do
      member = Visualization::Member.new
      member.must_be_instance_of Visualization::Member
      member.id.wont_be_nil
    end
  end #initialize

  describe '#store' do
    it 'persists attributes to the data repository' do
      member = Visualization::Member.new(name: 'foo')
      member.store

      member = Visualization::Member.new(id: member.id)
      member.name.must_be_nil

      member.fetch
      member.name.must_equal 'foo'
    end
  end #store

  describe '#fetch' do
    it 'fetches attributes from the data repository' do
      member = Visualization::Member.new(name: 'foo')
      member.store

      member = Visualization::Member.new(id: member.id)
      member.name = 'changed'
      member.fetch
      member.name.must_equal 'foo'
    end
  end #fetch

  describe '#delete' do
    it 'deletes this member data from the data repository' do
      member = Visualization::Member.new(name: 'foo')
      member.store

      member.fetch
      member.name.wont_be_nil

      member.delete
      member.name.must_be_nil

      lambda { member.fetch }.must_raise KeyError
    end
  end #delete
end # Visualization

