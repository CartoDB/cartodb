# encoding: utf-8

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
    db_config   = Rails.configuration.database_configuration[Rails.env]
    @db         = Sequel.postgres(
                    host:               db_config.fetch('host'),
                    port:               db_config.fetch('port'),
                    username:           db_config.fetch('username'),
                    schema_search_path: 'public'
                  )
    @relation   = "synchronizations_#{Time.now.to_i}".to_sym
    @repository = DataRepository::Backend::Sequel.new(@db, @relation)
    Synchronization.repository = @repository
  end

  describe '#fetch' do
    it 'fetches the members of a collection' do
      Synchronization::Member.new(random_attributes(name: 'sync_1')).store
      Synchronization::Member.new(random_attributes(name: 'sync_2')).store

      collection    = Synchronization::Collection.new
      records       = collection.fetch
      records.first.name.should == 'sync_1'
      records.to_a.last.name.should == 'sync_2'
    end
  end

  describe '#fetch_many' do
    it 'fetches many members of the collection to see that paging works' do
      for idx in 1..400
        Synchronization::Member.new(random_attributes(name: "sync_#{idx}")).store
      end

      collection = Synchronization::Collection.new
      records = collection.fetch
      records.first.name.should == 'sync_1'
      records.to_a.last.name.should == 'sync_300'
      records.count.should == 300

      records = collection.fetch(per_page: 900)
      records.first.name.should == 'sync_1'
      records.to_a.last.name.should == 'sync_400'
      records.count.should == 400
    end
  end


  def random_attributes(attributes={})
    random = unique_integer
    {
      name:       attributes.fetch(:name, "name #{random}"),
      interval:   attributes.fetch(:interval, random),
      state:      attributes.fetch(:state, 'enabled'),
    }
  end
end # Synchronization::Collection
