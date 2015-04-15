# encoding: utf-8

require_relative '../../spec_helper'

require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/synchronization/member'

include CartoDB

describe Synchronization::Member do
  before do
    Synchronization.repository = DataRepository.new
  end

  describe '#initialize' do
    it 'assigns an id by default' do
      member = Synchronization::Member.new
      member.should be_an_instance_of Synchronization::Member
      member.id.should_not be_nil
    end
  end #initialize

  describe '#store' do
    it 'persists attributes to the repository' do
      attributes  = random_attributes
      member      = Synchronization::Member.new(attributes)
      member.store

      member      = Synchronization::Member.new(id: member.id)
      member.name.should be_nil

      member.fetch
      member.name             .should == attributes.fetch(:name)
    end
  end

  describe '#fetch' do
    it 'fetches attributes from the repository' do
      attributes  = random_attributes
      member      = Synchronization::Member.new(attributes).store
      member      = Synchronization::Member.new(id: member.id)
      member.name = 'changed'
      member.fetch
      member.name.should == attributes.fetch(:name)
    end
  end

  describe '#delete' do
    it 'deletes this member from the repository' do
      member      = Synchronization::Member.new(random_attributes).store
      member.fetch
      member.name.should_not be_nil

      member.delete

      member.name.should be_nil
      lambda { member.fetch }.should raise_error KeyError
    end
  end

  def random_attributes(attributes={})
    random = rand(999)
    {
      name:       attributes.fetch(:name, "name #{random}"),
      interval:   attributes.fetch(:interval, 15 * 60 + random),
      state:      attributes.fetch(:state, 'enabled'),
    }
  end
end

