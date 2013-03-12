# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../app/models/visualization/member'

include CartoDB

describe Visualization::Member do
  describe '#initialize' do
    it 'assigns an id by default' do
      member = Visualization::Member.new
      member.must_be_instance_of Visualization::Member
      member.id.wont_be_nil
    end
  end #initialize

  describe '#store' do
    it 'persists the data' do
      member = Visualization::Member.new(name: 'foo')
      member.store

      member = Visualization::Member.new(id: member.id)
      member.name.must_be_nil

      member.fetch
      member.name.must_equal 'foo'
    end
  end #store

  describe '#fetch' do
    it 'fetches data from the repository' do
      member = Visualization::Member.new(name: 'foo')
      member.store

      member = Visualization::Member.new(id: member.id)
      member.name = 'changed'
      member.fetch
      member.name.must_equal 'foo'
    end
  end #fetch
end # Visualization

