# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/synchronization/collection'
require_relative '../../../app/models/synchronization/member'
require_relative '../../../app/models/synchronization/migrator'

include CartoDB

describe Synchronization::Collection do
  before(:each) do
    db_config   = Rails.configuration.database_configuration[Rails.env]
    @db         = Sequel.postgres(
                    host:     db_config.fetch('host'),
                    port:     db_config.fetch('port'),
                    username: db_config.fetch('username')
                  )
    @relation   = "synchronizations_#{Time.now.to_i}".to_sym
    @repository = DataRepository::Backend::Sequel.new(@db, @relation)
    Synchronization::Migrator.new(@db).migrate(@relation)
    Synchronization.repository = @repository
  end

  after(:each) do
    Synchronization::Migrator.new(@db).drop(@relation)
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

  def random_attributes(attributes={})
    random = rand(999)
    {
      name:       attributes.fetch(:name, "name #{random}"),
      interval:   attributes.fetch(:interval, random),
      state:      attributes.fetch(:state, 'enabled'),
    }
  end
end # Synchronization::Collection

