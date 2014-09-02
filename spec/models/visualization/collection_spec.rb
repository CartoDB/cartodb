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
    # Why not passing db_config directly to Sequel.postgres here ?
    # See https://github.com/CartoDB/cartodb/issues/421
    @db         = Sequel.postgres(
                    host:     db_config.fetch('host'),
                    port:     db_config.fetch('port'),
                    database: db_config.fetch('database'),
                    username: db_config.fetch('username')
                  )
    # Careful, uses another DB table (and deletes it at after:(each) )
    @relation   = "visualizations_#{Time.now.to_i}".to_sym
    @repository = DataRepository::Backend::Sequel.new(@db, @relation)
    Visualization::Migrator.new(@db).migrate(@relation)
    Visualization.repository = @repository

    # Using Mocha stubs until we update RSpec (@see http://gofreerange.com/mocha/docs/Mocha/ClassMethods.html)
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

    # For relator->permission
    user_id = UUIDTools::UUID.timestamp_create.to_s
    user_name = 'whatever'
    user_apikey = '123'
    @user_mock = mock
    @user_mock.stubs(:id).returns(user_id)
    @user_mock.stubs(:username).returns(user_name)
    @user_mock.stubs(:api_key).returns(user_apikey)
    CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(@user_mock)
  end

  after(:each) do
    Visualization::Migrator.new(@db).drop(@relation)
  end

  describe '#fetch' do
    it 'filters by tag if the backend supports array columns' do
      attributes1  = random_attributes(tags: ['tag 1', 'tag 11'], user_id: UUIDTools::UUID.timestamp_create.to_s)
      attributes2  = random_attributes(tags: ['tag 2', 'tag 22'], user_id: UUIDTools::UUID.timestamp_create.to_s)
      Visualization::Member.new(attributes1).store
      Visualization::Member.new(attributes2).store

      collection    = Visualization::Collection.new({})
      collection.fetch(tags: 'tag 1').count.should == 1
    end

    it 'filters by partial name / description match' do
      attributes1 =
        random_attributes(name: 'viz_1', description: 'description_11', user_id: UUIDTools::UUID.timestamp_create.to_s)
      attributes2 =
        random_attributes(name: 'viz_2', description: 'description_22', user_id: UUIDTools::UUID.timestamp_create.to_s)
      Visualization::Member.new(attributes1).store
      Visualization::Member.new(attributes2).store

      collection    = Visualization::Collection.new
      collection.fetch(q: 'viz').count.should   == 2
      collection.fetch(q: 'viz_1').count.should == 1

      collection    = Visualization::Collection.new
      collection.fetch(q: 'description').count.should  == 2
      collection.fetch(q: 'ion_11').count.should == 1
      collection.fetch(q: 'ion_22').count.should == 1
    end

    it 'orders the collection by the passed criteria' do
      Visualization::Member.new(random_attributes(name: 'viz_1')).store
      Visualization::Member.new(random_attributes(name: 'viz_2')).store

      collection    = Visualization::Collection.new
      records       = collection.fetch(o: { name: 'asc' })
      records.first.name.should == 'viz_1'

      records       = collection.fetch(o: { name: 'desc' })
      records.first.name.should == 'viz_2'
    end

    it 'checks fetching with, without and only shared entities' do
      vis_1_name = 'viz_1'
      vis_2_name = 'viz_2'
      vis_3_name = 'viz_3'
      user1_id = UUIDTools::UUID.timestamp_create.to_s
      user2_id = UUIDTools::UUID.timestamp_create.to_s
      Visualization::Member.new(random_attributes(name: vis_1_name, user_id: user1_id)).store
      vis2 = Visualization::Member.new(random_attributes(name: vis_2_name, user_id: user2_id)).store
      vis3 = Visualization::Member.new(random_attributes(name: vis_3_name)).store

      shared_entity = CartoDB::SharedEntity.new(
          recipient_id:   user1_id,
          recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
          entity_id:      vis2.id,
          entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )
      shared_entity.save
      shared_entity.reload

      collection = Visualization::Collection.new
      collection.stubs(:user_shared_vis).with(user1_id).returns([vis2.id])

      # Unfiltered
      records = collection.fetch
      records.count.should eq 3

      # Filter by user_id and non-owned id (excluding shared)
      records = collection.fetch(user_id: user1_id, id: vis3.id, exclude_shared: true)
      records.count.should eq 0

      # Filter by user_id and non-owned id (not excluding shared)
      records = collection.fetch(user_id: user1_id, id: vis3.id)
      records.count.should eq 0

      # Filter by name (not present user_id)
      records = collection.fetch(name: vis_1_name)
      records.count.should eq 1
      records.first.name.should eq vis_1_name

      # Filter by user_id (includes shared)
      records = collection.fetch(user_id: user1_id).map { |item| item }
      records.count.should eq 2
      ((records[0].name == vis_1_name || records[0].name == vis_2_name) && \
       (records[1].name == vis_1_name || records[1].name == vis_2_name)).should eq true

      # Filter by user_id excluding shared
      records = collection.fetch(user_id: user1_id, exclude_shared: true)
      records.count.should eq 1
      records.first.name.should eq vis_1_name

      # Filter by user_id and only shared
      records = collection.fetch(user_id: user1_id, only_shared: true)
      records.count.should eq 1
      records.first.name.should eq vis_2_name
    end

    it 'checks that filtering collection by locked works' do
      vis1 = Visualization::Member.new(random_attributes(name: 'viz_1', locked:true)).store
      vis2 = Visualization::Member.new(random_attributes(name: 'viz_2', locked:false)).store

      collection = Visualization::Collection.new

      records = collection.fetch()
      records.count.should eq 2

      records = collection.fetch(locked: false)
      records.count.should eq 1
      records.first.name.should eq vis2.name

      records = collection.fetch(locked: true)
      records.count.should eq 1
      records.first.name.should eq vis1.name
    end

    it "checks that shared entities appear no matter if they're locked or not" do
      vis_1_name = 'viz_1'
      vis_2_name = 'viz_2'
      vis_3_name = 'viz_3'
      vis_4_name = 'viz_4'
      user1_id = UUIDTools::UUID.timestamp_create.to_s
      user2_id = UUIDTools::UUID.timestamp_create.to_s
      Visualization::Member.new(random_attributes({
                                                    name: vis_1_name,
                                                    user_id: user1_id,
                                                    locked:true
                                                  })).store
      vis2 = Visualization::Member.new(random_attributes({
                                                           name: vis_2_name,
                                                           user_id: user2_id,
                                                           locked:true
                                                         })).store
      vis3 = Visualization::Member.new(random_attributes({
                                                             name: vis_3_name,
                                                             user_id: user2_id,
                                                             locked:false
                                                         })).store
      Visualization::Member.new(random_attributes({
                                                      name: vis_4_name,
                                                      user_id: user1_id,
                                                      locked:false
                                                  })).store

      shared_entity = CartoDB::SharedEntity.new(
          recipient_id:   user1_id,
          recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
          entity_id:      vis2.id,
          entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )
      shared_entity.save
      shared_entity = CartoDB::SharedEntity.new(
          recipient_id:   user1_id,
          recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
          entity_id:      vis3.id,
          entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )
      shared_entity.save

      collection = Visualization::Collection.new
      collection.stubs(:user_shared_vis).with(user1_id).returns([vis2.id, vis3.id])

      # Non-locked vis, all shared vis
      records = collection.fetch(user_id: user1_id)
      records.count.should eq 4

      # Same behaviour, non-locked, all shared
      records = collection.fetch(user_id: user1_id, locked:false)
      records.count.should eq 3


      # Only user vis, no shared vis at all
      records = collection.fetch(user_id: user1_id, locked:true)
      records.count.should eq 1
      records.map { |record| record.name }.first.should eq vis_1_name
    end
  end

  # Slide visualization types specs

  # This should be a member_spec test, but as those specs have no collection support...
  it 'checks the .children method' do
    Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

    member = Visualization::Member.new(random_attributes({ type: Visualization::Member::TYPE_SLIDE })).store

    member.children.count.should eq 0

    Visualization::Member.new(random_attributes({
      type:      Visualization::Member::TYPE_SLIDE,
      parent_id: member.id
    })).store

    member.children.count.should eq 1

    Visualization::Member.new(random_attributes({
      type:      Visualization::Member::TYPE_SLIDE,
      parent_id: member.id
    })).store

    member.children.count.should eq 2

    canonical = Visualization::Member.new(random_attributes({ type: Visualization::Member::TYPE_CANONICAL })).store

    member.children.count.should eq 2
    canonical.children.should eq nil

    member2 = Visualization::Member.new(random_attributes({ type: Visualization::Member::TYPE_SLIDE })).store

    Visualization::Member.new(random_attributes({
      type:      Visualization::Member::TYPE_SLIDE,
      parent_id: member2.id
    })).store

    member2.children.count.should eq 1
  end

  it 'checks that upon retrieving slides from the collection, does not show children' do
    userid = UUIDTools::UUID.timestamp_create.to_s
    Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)
    member = Visualization::Member.new(random_attributes({
      type:     Visualization::Member::TYPE_SLIDE,
      user_id:  userid
    })).store

    Visualization::Member.new(random_attributes({
      type:       Visualization::Member::TYPE_SLIDE,
      parent_id:  member.id,
      user_id:    userid
    })).store
    Visualization::Member.new(random_attributes({
      type:       Visualization::Member::TYPE_SLIDE,
      parent_id:  member.id,
      user_id:    userid
    })).store

    collection = Visualization::Collection.new.fetch({
       user_id: userid,
       type:    Visualization::Member::TYPE_SLIDE
    })
    collection.count.should eq 1
    items = collection.select{ |vis| vis }
    items.first.id.should eq member.id
  end

  it 'checks that upon destruction children are destroyed too' do
    Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

    member = Visualization::Member.new(random_attributes({
        type:     Visualization::Member::TYPE_SLIDE
    })).store

    Visualization::Member.new(random_attributes({
        type:       Visualization::Member::TYPE_SLIDE,
        parent_id:  member.id
    })).store
    Visualization::Member.new(random_attributes({
        type:       Visualization::Member::TYPE_SLIDE,
        parent_id:  member.id
    })).store

    member.delete

    collection = Visualization::Collection.new.fetch
    collection.count.should eq 0
  end

  protected

  def random_attributes(attributes={})
    random = rand(999)
    {
      name:         attributes.fetch(:name, "name #{random}"),
      description:  attributes.fetch(:description, "description #{random}"),
      privacy:      attributes.fetch(:privacy, 'public'),
      tags:         attributes.fetch(:tags, ['tag 1']),
      type:         attributes.fetch(:type, CartoDB::Visualization::Member::TYPE_CANONICAL),
      user_id:      attributes.fetch(:user_id, UUIDTools::UUID.timestamp_create.to_s),
      locked:       attributes.fetch(:locked, false),
      title:        attributes.fetch(:title, ''),
      source:       attributes.fetch(:source, ''),
      license:      attributes.fetch(:license, ''),
      parent_id:    attributes.fetch(:parent_id, nil)
    }
  end #random_attributes
end # Visualization::Collection

