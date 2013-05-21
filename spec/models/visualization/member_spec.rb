# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../services/data-repository/backend/sequel'
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
      member.should be_an_instance_of Visualization::Member
      member.id.should_not be_nil
    end
  end #initialize

  describe '#store' do
    it 'persists attributes to the data repository' do
      member = Visualization::Member.new(
        name:             'foo',
        active_layer_id:  3
      )
      member.store

      member = Visualization::Member.new(id: member.id)
      member.name.should be_nil

      member.fetch
      member.name             .should == 'foo'
      member.active_layer_id  .should == 3
    end

    it 'persists tags as an array if the backend supports it' do
      db          = Sequel.postgres(host: Rails.configuration.database_configuration[Rails.env]["host"], port: Rails.configuration.database_configuration[Rails.env]["port"], username: Rails.configuration.database_configuration[Rails.env]["username"])
      relation    = :"visualizations_#{Time.now.to_i}"
      create_visualizations_table_in(db, relation)

      repository  = DataRepository::Backend::Sequel.new(db, relation)
      attributes  = { name: 'foo', tags: ['tag 1', 'tag 2'] }
      member      = Visualization::Member.new(attributes, repository)
      member.store
      
      member      = Visualization::Member.new({ id: member.id }, repository)
      member.fetch
      member.tags.should include('tag 1')
      member.tags.should include('tag 2')

      drop_table_from(db, relation)
    end

    it 'persists tags as JSON if the backend does not support arrays' do
      member = Visualization::Member.new(name: 'foo', tags: ['tag 1', 'tag 2'])
      member.store

      member = Visualization::Member.new(id: member.id)
      member.fetch
      member.tags.should include('tag 1')
      member.tags.should include('tag 2')
    end
  end #store

  describe '#fetch' do
    it 'fetches attributes from the data repository' do
      member = Visualization::Member.new(name: 'foo')
      member.store

      member = Visualization::Member.new(id: member.id)
      member.name = 'changed'
      member.fetch
      member.name.should == 'foo'
    end
  end #fetch

  describe '#delete' do
    it 'deletes this member data from the data repository' do
      member = Visualization::Member.new(name: 'foo')
      member.store

      member.fetch
      member.name.should_not be_nil

      member.delete
      member.name.should be_nil

      lambda { member.fetch }.should raise_error KeyError
    end
  end #delete

  describe '#public?' do
    it 'returns true if privacy set to public' do
      visualization = Visualization::Member.new
      visualization.public?.should == true

      visualization.privacy = 'private'
      visualization.public?.should == false

      visualization.privacy = 'public'
      visualization.public?.should == true
    end
  end #public?

  describe '#authorize?' do
    it 'returns true if user maps include map_id' do
      map_id  = rand(99)
      member  = Visualization::Member.new(name: 'foo', map_id: map_id)

      maps    = [OpenStruct.new(id: map_id)]
      user    = OpenStruct.new(maps: maps)
      member.authorize?(user).should == true

      maps    = [OpenStruct.new(id: 999)]
      user    = OpenStruct.new(maps: maps)
      member.authorize?(user).should == false
    end
  end #authorize?

  def create_visualizations_table_in(db, relation)
    db.create_table relation do
      String    :id, primary_key: true
      String    :name
      String    :description
      Integer   :map_id, index: true
      Integer   :active_layer_id
      String    :type
      String    :privacy
    end

    db.run(%Q{
      ALTER TABLE "#{relation}"
      ADD COLUMN tags text[]
    })
  end #create_visualizations_table_in

  def drop_table_from(db, relation)
    db.drop_table relation.to_sym
  end #drop_table_from
end # Visualization

