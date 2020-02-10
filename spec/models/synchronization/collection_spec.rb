require_relative '../../spec_helper'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/synchronization/collection'
require_relative '../../../app/models/synchronization/member'
require 'helpers/unique_names_helper'

include UniqueNamesHelper
include CartoDB

describe Synchronization::Collection do

  before(:each) do
  end

  describe '#fetch' do
    it 'fetches the members of a collection' do
      user_id = random_uuid
      Synchronization::Member.new(random_attributes(name: 'sync_1',
                                                    user_id: user_id)).store
      Synchronization::Member.new(random_attributes(name: 'sync_2',
                                                    user_id: user_id)).store

      collection    = Synchronization::Collection.new
      records       = collection.fetch(user_id: user_id)
      records.first.name.should == 'sync_1'
      records.to_a.last.name.should == 'sync_2'
    end
  end

  describe '#fetch_many' do
    it 'fetches many members of the collection to see that paging works' do
      user_id = random_uuid
      (1..400).each do |idx|
        Synchronization::Member.new(random_attributes(name:   "sync_#{idx}",
                                                      user_id: user_id)).store
      end

      collection = Synchronization::Collection.new
      records = collection.fetch(user_id: user_id)
      records.first.name.should == 'sync_1'
      records.to_a.last.name.should == 'sync_300'
      records.count.should == 300

      records = collection.fetch(user_id: user_id, per_page: 900)
      records.first.name.should == 'sync_1'
      records.to_a.last.name.should == 'sync_400'
      records.count.should == 400
    end
  end

  def random_attributes(attributes = {})
    random = unique_integer
    {
      name:       attributes.fetch(:name, "name #{random}"),
      interval:   attributes.fetch(:interval, 900),
      state:      attributes.fetch(:state, 'enabled'),
      user_id:    attributes.fetch(:user_id, random_uuid)
    }
  end
end # Synchronization::Collection
