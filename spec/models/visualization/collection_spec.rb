# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/visualization/collection'
require_relative '../../../app/models/visualization/member'

include CartoDB

describe Visualization::Collection do
  before(:each) do
    db_config   = Rails.configuration.database_configuration[Rails.env]
    @db         = Sequel.postgres(
                    host:     db_config.fetch('host'),
                    port:     db_config.fetch('port'),
                    username: db_config.fetch('username')
                  )
    @relation   = "visualizations_#{Time.now.to_i}".to_sym
    @repository = DataRepository::Backend::Sequel.new(@db, @relation)
    Visualization::Migrator.new(@db).migrate(@relation)
    Visualization.repository = @repository
  end

  after(:each) do
    Visualization::Migrator.new(@db).drop(@relation)
  end

  describe '#fetch' do
    it 'filters by tag if the backend supports array columns' do
      attributes_1  = { name: 'viz 1', tags: ['tag 1', 'tag 11'], privacy: 'public' }
      attributes_2  = { name: 'viz 2', tags: ['tag 2', 'tag 22'], privacy: 'public' }
      Visualization::Member.new(attributes_1).store
      Visualization::Member.new(attributes_2).store

      collection    = Visualization::Collection.new({})
      collection.fetch(tags: 'tag 1').count.should == 1
    end

    it 'filters by partial name / description match' do
      attributes_1  = { name: 'viz_1', description: 'description_11', privacy: 'public' }
      attributes_2  = { name: 'viz_2', description: 'description_22', privacy: 'public' }
      Visualization::Member.new(attributes_1).store
      Visualization::Member.new(attributes_2).store

      collection    = Visualization::Collection.new
      collection.fetch(q: 'viz').count.should   == 2
      collection.fetch(q: 'viz_1').count.should == 1

      collection    = Visualization::Collection.new
      collection.fetch(q: 'description').count.should  == 2
      collection.fetch(q: 'ion_11').count.should == 1
      collection.fetch(q: 'ion_22').count.should == 1
    end

    it 'orders the collection by the passed criteria' do
      attributes_1  = { name: 'viz_1', description: 'description_11', privacy: 'public' }
      attributes_2  = { name: 'viz_2', description: 'description_22', privacy: 'public' }
      Visualization::Member.new(attributes_1).store
      Visualization::Member.new(attributes_2).store

      collection    = Visualization::Collection.new
      records       = collection.fetch(o: { name: 'asc' })
      records.first.name.should == 'viz_1'

      records       = collection.fetch(o: { name: 'desc' })
      records.first.name.should == 'viz_2'
    end
  end
end # Visualization::Collection

