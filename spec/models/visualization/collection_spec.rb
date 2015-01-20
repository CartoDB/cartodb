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
      records       = collection.fetch(order: :name)
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
      ((records[0].name == vis_1_name || records[0].name == vis_2_name) &&
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

    it 'Checks all supported sorting methods work' do
      # Supported: updated_at, likes, mapviews, row_count, size
      # TODO: Add mapviews test. As it uses redis requires more work

      # Restore Vis backend to normal table so Relator works
      Visualization.repository = DataRepository::Backend::Sequel.new(@db, :visualizations)
      begin
        Visualization::Migrator.new(@db).drop(:visualizations)
      rescue
        # Do nothing, visualizations table not existed before
      end
      Visualization::Migrator.new(@db).migrate(:visualizations)


      user = create_user(:quota_in_bytes => 524288000, :table_quota => 500)
      user2 = create_user(:quota_in_bytes => 524288000, :table_quota => 500)
      CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(user)

      table1 = Table.new
      table1.user_id = user.id
      table1.name = "viz#{rand(999)}_1"
      table1.save
      table2 = Table.new
      table2.user_id = user.id
      table2.name = "viz#{rand(999)}_2"
      table2.save
      table3 = Table.new
      table3.user_id = user.id
      table3.name = "viz#{rand(999)}_3"
      table3.save

      vis1 = table1.table_visualization
      vis2 = table2.table_visualization
      vis3 = table3.table_visualization

      # Biggest row count
      vis3.table.add_column!(name: "test_col", type: "text")
      vis3.table.insert_row!(test_col: "333")
      vis3.table.insert_row!(test_col: "333")
      vis3.table.insert_row!(test_col: "333")
      vis3.table.insert_row!(test_col: "333")
      vis3.table.insert_row!(test_col: "333")
      vis3.table.insert_row!(test_col: "333")
      # pg_class.reltuples only get updated after VACUUMs, etc.
      user.in_database.run(%Q{ VACUUM #{table3.name} })
      vis3.add_like_from(user.id)
      vis3.fetch.store.fetch

      # Biggest in size and likes
      long_string = ""
      2000.times do
        long_string << rand(999).to_s
      end
      vis2.table.add_column!(name: "test_col", type: "text")
      vis2.table.add_column!(name: "test_col2", type: "text")
      vis2.table.add_column!(name: "test_col3", type: "text")
      vis2.table.insert_row!(test_col: long_string, test_col2: long_string, test_col3: long_string)
      vis2.table.insert_row!(test_col: long_string, test_col2: long_string, test_col3: long_string)
      vis2.table.insert_row!(test_col: long_string, test_col2: long_string, test_col3: long_string)
      vis2.table.insert_row!(test_col: long_string, test_col2: long_string, test_col3: long_string)
      user.in_database.run(%Q{ VACUUM #{table2.name} })
      vis2.add_like_from(user.id)
      vis2.add_like_from(user2.id)
      sleep(1)   # To avoid same sec storage
      vis2.fetch.store.fetch

      # Latest edited
      vis1.table.add_column!(name: "test_col", type: "text")
      table = vis1.table
      table.insert_row!(test_col: "111")
      user.in_database.run(%Q{ VACUUM #{table1.name} })
      sleep(1)   # To avoid same sec storage
      vis1.fetch.store.fetch

      # Actual tests start here

      collection = Visualization::Collection.new.fetch({
                                                           user_id: user.id,
                                                           order: 'updated_at',
                                                           exclude_shared: true
                                                       })
      collection.count.should eq 3
      ids = collection.map { |vis| vis.id }
      expected_updated_ats = [ vis1.id, vis2.id, vis3.id ]
      ids.should eq expected_updated_ats

      collection = Visualization::Collection.new.fetch({
                                                           user_id: user.id,
                                                           order: :row_count,
                                                           exclude_shared: true
                                                       })
      collection.count.should eq 3
      ids = collection.map { |vis| vis.id }
      expected_row_count = [ vis3.id, vis2.id, vis1.id ]
      ids.should eq expected_row_count

      collection = Visualization::Collection.new.fetch({
                                                           user_id: user.id,
                                                           order: :likes,
                                                           exclude_shared: true
                                                       })
      collection.count.should eq 3
      ids = collection.map { |vis| vis.id }
      expected_likes = [ vis2.id, vis3.id, vis1.id ]
      ids.should eq expected_likes

      collection = Visualization::Collection.new.fetch({
                                                           user_id: user.id,
                                                           order: :size,
                                                           exclude_shared: true
                                                       })
      collection.count.should eq 3
      ids = collection.map { |vis| vis.id }
      expected_size = [ vis2.id, vis3.id, vis1.id ]
      ids.should eq expected_size

      # Cleanup
      vis1.delete
      vis2.delete
      vis3.delete
    end
  end

  describe 'single methods' do
    it 'checks count_total method' do
      vis_1_name = 'viz_1'
      vis_2_name = 'viz_2'
      vis_3_name = 'viz_3'
      vis_4_name = 'viz_4'
      user1_id = UUIDTools::UUID.timestamp_create.to_s
      user2_id = UUIDTools::UUID.timestamp_create.to_s
      Visualization::Member.new(random_attributes(name: vis_1_name, user_id: user1_id)).store
      Visualization::Member.new(random_attributes(name: vis_2_name, privacy: 'private', user_id: user1_id)).store
      vis_user2 = Visualization::Member.new(random_attributes(name: vis_3_name, user_id: user2_id)).store
      vis2_user2 = Visualization::Member.new(random_attributes(name: vis_4_name, user_id: user2_id)).store

      shared_entity = CartoDB::SharedEntity.new(
        recipient_id:   user1_id,
        recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
        entity_id:      vis_user2.id,
        entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )
      shared_entity.save
      shared_entity.reload

      collection = Visualization::Collection.new
      collection.stubs(:user_shared_vis).with(user1_id).returns([vis_user2.id])

      records = collection.fetch(user_id: user1_id)
      records.count.should eq 3

      collection.count_total(user_id: user1_id).should eq 2

      # Other filters should be skipped
      collection.count_total(user_id: user1_id, id: vis_user2.id).should eq 2
      collection.count_total(user_id: user1_id, id: vis2_user2.id).should eq 2
      collection.count_total(user_id: user1_id, name: 'test').should eq 2
      collection.count_total(user_id: user1_id, description: 'test').should eq 2
      collection.count_total(user_id: user1_id, privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE).should eq 2
      collection.count_total(user_id: user1_id, locked: true).should eq 2
      collection.count_total(user_id: user1_id, exclude_shared: false).should eq 2
      collection.count_total(user_id: user1_id, only_shared: false).should eq 2

      # If unauthenticated remove private ones
      collection.count_total(user_id: user1_id, unauthenticated: true).should eq 1

      # Type filters are allowed
      collection.count_total(user_id: user1_id, type: CartoDB::Visualization::Member::CANONICAL_TYPE).should eq 2
      collection.count_total(user_id: user1_id, type: CartoDB::Visualization::Member::DERIVED_TYPE).should eq 0

      # And filtering by user_id
      collection.count_total(user_id: user2_id).should eq 2
    end

  end

  def random_attributes(attributes={})
    random = rand(999)
    {
      name:         attributes.fetch(:name, "name #{random}"),
      description:  attributes.fetch(:description, "description #{random}"),
      privacy:      attributes.fetch(:privacy, 'public'),
      tags:         attributes.fetch(:tags, ['tag 1']),
      type:         attributes.fetch(:type, CartoDB::Visualization::Member::CANONICAL_TYPE),
      user_id:      attributes.fetch(:user_id, UUIDTools::UUID.timestamp_create.to_s),
      locked:       attributes.fetch(:locked, false),
      title:        attributes.fetch(:title, ''),
      source:       attributes.fetch(:source, ''),
      license:      attributes.fetch(:license, ''),
      kind:         attributes.fetch(:kind, CartoDB::Visualization::Member::KIND_GEOM),
      map_id:       attributes.fetch(:map_id, nil)
    }
  end #random_attributes
end # Visualization::Collection

