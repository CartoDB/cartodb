# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/visualization/collection'
require_relative '../../../app/models/visualization/member'
require_relative '../../doubles/support_tables.rb'

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

    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(get: nil, create: true, update: true)

    # For relator->permission
    user_id = UUIDTools::UUID.timestamp_create.to_s
    user_name = 'whatever'
    user_apikey = '123'
    @user_1_mock = create_mocked_user
    CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(@user_1_mock)

    @user_1 = FactoryGirl.create(:valid_user, quota_in_bytes: 524288000, table_quota: 500, private_tables_enabled: true)
    @user_2 = FactoryGirl.create(:valid_user, private_tables_enabled: true)
  end

  after(:each) do
    Visualization::Migrator.new(@db).drop(@relation)
    restore_vis_backend_to_normal_table_so_relator_works
  end

  after(:all) do
    @user_1.destroy
    @user_2.destroy
  end

  def restore_vis_backend_to_normal_table_so_relator_works
    Visualization.repository = DataRepository::Backend::Sequel.new(@db, :visualizations)
  end

  describe '#fetch' do
    it 'filters by tag if the backend supports array columns' do
      attributes1  = random_attributes_for_vis_member(tags: ['tag 1', 'tag 11'], user_id: UUIDTools::UUID.timestamp_create.to_s)
      attributes2  = random_attributes_for_vis_member(tags: ['tag 2', 'tag 22'], user_id: UUIDTools::UUID.timestamp_create.to_s)
      Visualization::Member.new(attributes1).store
      Visualization::Member.new(attributes2).store

      collection    = Visualization::Collection.new
      collection.fetch(tags: 'tag 1').count.should == 1
    end

    it 'filters by partial name / description match' do
      attributes1 =
        random_attributes_for_vis_member(name: 'viz_1', description: 'description_11', user_id: UUIDTools::UUID.timestamp_create.to_s)
      attributes2 =
        random_attributes_for_vis_member(name: 'viz_2', description: 'description_22', user_id: UUIDTools::UUID.timestamp_create.to_s)
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
      userid = UUIDTools::UUID.timestamp_create.to_s
      Visualization::Member.new(random_attributes_for_vis_member({
                                                                   user_id: userid,
                                                                   name: 'viz_1'
                                                                 })).store
      Visualization::Member.new(random_attributes_for_vis_member({
                                                                   user_id: userid,
                                                                   name: 'viz_2'
                                                                 })).store

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
      user3_id = UUIDTools::UUID.timestamp_create.to_s
      Visualization::Member.new(random_attributes_for_vis_member({
                                                                   name: vis_1_name,
                                                                   user_id: user1_id
                                                                 })).store
      vis2 = Visualization::Member.new(random_attributes_for_vis_member({
                                                                          name: vis_2_name,
                                                                          user_id: user2_id
                                                                        })).store
      vis3 = Visualization::Member.new(random_attributes_for_vis_member({
                                                                          name: vis_3_name,
                                                                          user_id: user3_id
                                                                        })).store

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
      userid = UUIDTools::UUID.timestamp_create.to_s

      collection = Visualization::Collection.new

      vis1 = Visualization::Member.new(random_attributes_for_vis_member({
                                                                          user_id: userid,
                                                                          name: 'viz_1',
                                                                          locked:true
                                                                        })).store
      vis2 = Visualization::Member.new(random_attributes_for_vis_member({
                                                                          user_id: userid,
                                                                          name: 'viz_2',
                                                                          locked:false
                                                                        })).store

      records = collection.fetch
      records.count.should eq 2

      records = collection.fetch(user_id: userid, locked: false)
      records.count.should eq 1
      records.first.name.should eq vis2.name

      records = collection.fetch(user_id: userid, locked: true)
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

      starting_count = Visualization::Collection.new.fetch(user_id: user1_id).count

      Visualization::Member.new(random_attributes_for_vis_member({
                                                    name: vis_1_name,
                                                    user_id: user1_id,
                                                    locked:true
                                                  })).store
      vis2 = Visualization::Member.new(random_attributes_for_vis_member({
                                                           name: vis_2_name,
                                                           user_id: user2_id,
                                                           locked:true
                                                         })).store
      vis3 = Visualization::Member.new(random_attributes_for_vis_member({
                                                             name: vis_3_name,
                                                             user_id: user2_id,
                                                             locked:false
                                                         })).store
      Visualization::Member.new(random_attributes_for_vis_member({
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
      records.count.should eq 4 + starting_count

      # Same behaviour, non-locked, all shared
      records = collection.fetch(user_id: user1_id, locked:false)
      records.count.should eq 3 + starting_count

      # Only user vis, no shared vis at all
      records = collection.fetch(user_id: user1_id, locked:true)
      records.count.should eq 1 + starting_count
      records.map { |record| record.name }.first.should eq vis_1_name
    end

    it 'Checks all supported sorting methods work' do
      # Supported: updated_at, likes, mapviews, row_count, size
      # TODO: Add mapviews test. As it uses redis requires more work

      # Restore Vis backend to normal table so Relator works
      restore_vis_backend_to_normal_table_so_relator_works

      CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(@user_1)

      table1 = Table.new
      table1.user_id = @user_1.id
      table1.name = "viz#{rand(999)}_1"
      table1.save
      table2 = Table.new
      table2.user_id = @user_1.id
      table2.name = "viz#{rand(999)}_2"
      table2.save
      table3 = Table.new
      table3.user_id = @user_1.id
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
      @user_1.in_database.run(%Q{ VACUUM #{table3.name} })
      vis3.add_like_from(@user_1.id)
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
      @user_1.in_database.run(%Q{ VACUUM #{table2.name} })
      vis2.add_like_from(@user_1.id)
      vis2.add_like_from(@user_2.id)
      sleep(1)   # To avoid same sec storage
      vis2.fetch.store.fetch

      # Latest edited
      vis1.table.add_column!(name: "test_col", type: "text")
      table = vis1.table
      table.insert_row!(test_col: "111")
      @user_1.in_database.run(%Q{ VACUUM #{table1.name} })
      sleep(1)   # To avoid same sec storage
      vis1.fetch.store.fetch

      # Actual tests start here

      collection = Visualization::Collection.new.fetch({
                                                           user_id: @user_1.id,
                                                           order: 'updated_at',
                                                           exclude_shared: true
                                                       })
      collection.count.should eq 3
      ids = collection.map { |vis| vis.id }
      expected_updated_ats = [ vis1.id, vis2.id, vis3.id ]
      ids.should eq expected_updated_ats

      collection = Visualization::Collection.new.fetch({
                                                           user_id: @user_1.id,
                                                           order: :row_count,
                                                           exclude_shared: true
                                                       })
      collection.count.should eq 3
      ids = collection.map { |vis| vis.id }
      expected_row_count = [ vis3.id, vis2.id, vis1.id ]
      ids.should eq expected_row_count

      collection = Visualization::Collection.new.fetch({
                                                           user_id: @user_1.id,
                                                           order: :likes,
                                                           exclude_shared: true
                                                       })
      collection.count.should eq 3
      ids = collection.map { |vis| vis.id }
      expected_likes = [ vis2.id, vis3.id, vis1.id ]
      ids.should eq expected_likes

      collection = Visualization::Collection.new.fetch({
                                                           user_id: @user_1.id,
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

    def create_table(user, name = "viz#{rand(999)}")
      table = Table.new
      table.user_id = user.id
      table.name = name
      table.save
    end

    def liked(user, type = Visualization::Member::TYPE_CANONICAL)
      Visualization::Collection.new.fetch( { user_id: user.id, only_liked: true })
    end

    def liked_count(user, type = Visualization::Member::TYPE_CANONICAL)
      liked(user,type).total_liked_entries(type)
    end

    it 'counts total liked' do
      restore_vis_backend_to_normal_table_so_relator_works

      @user_1.stubs(:organization).returns(nil)
      @user_2.stubs(:organization).returns(nil)

      table11 = create_table(@user_1)
      v11 = table11.table_visualization
      table12 = create_table(@user_1)
      v12 = table12.table_visualization
      table21 = create_table(@user_2)
      v21 = table21.table_visualization
      [[v11, @user_1], [v12, @user_1], [v21, @user_2]].each { |v, u|
        v.privacy = Visualization::Member::PRIVACY_PUBLIC
        v.store
      }

      liked(@user_1).count.should eq 0
      liked_count(@user_1).should eq 0
      liked(@user_2).count.should eq 0
      liked_count(@user_2).should eq 0

      v11.add_like_from(@user_2.id)
      liked(@user_1).count.should eq 0
      liked_count(@user_1).should eq 0
      liked(@user_2).count.should eq 1
      liked_count(@user_2).should eq 1

      v12.add_like_from(@user_1.id)
      liked(@user_1).count.should eq 1
      liked_count(@user_1).should eq 1
      liked(@user_2).count.should eq 1
      liked_count(@user_2).should eq 1

      v21.add_like_from(@user_2.id)
      liked(@user_1).count.should eq 1
      liked_count(@user_1).should eq 1
      liked(@user_2).count.should eq 2
      liked_count(@user_2).should eq 2

      v21.add_like_from(@user_1.id)
      liked(@user_1).count.should eq 2
      liked_count(@user_1).should eq 2
      liked(@user_2).count.should eq 2
      liked_count(@user_2).should eq 2

      # Turning a visualization link should keep it from other users count
      v21.privacy = Visualization::Member::PRIVACY_LINK
      v21.stubs(:user).returns(@user_2)
      v21.store
      liked(@user_1).count.should eq 2
      liked_count(@user_1).should eq 2
      liked(@user_2).count.should eq 2
      liked_count(@user_2).should eq 2

      # Turning a visualization private should remove it from other users count
      v21.privacy = Visualization::Member::PRIVACY_PRIVATE
      v21.store
      liked(@user_1).count.should eq 1
      liked_count(@user_1).should eq 1
      liked(@user_2).count.should eq 2
      liked_count(@user_2).should eq 2

      # Adding permission to user should add it to count and list
      permission = v21.permission
      permission.acl = [ { type: CartoDB::Permission::TYPE_USER,
          entity: {
            id: @user_1.id,
            username: @user_1.username
          },
          access: CartoDB::Permission::ACCESS_READONLY } ]
      v21.stubs(:invalidate_cache).returns(nil)
      permission.stubs(:entity).returns(v21)
      permission.stubs(:notify_permissions_change).returns(nil)
      permission.save
      liked(@user_1).count.should eq 2
      liked_count(@user_1).should eq 2
      liked(@user_2).count.should eq 2
      liked_count(@user_2).should eq 2

      # Sharing a table won't count it as liked
      table22 = create_table(@user_2)
      v22 = table22.table_visualization
      v22.privacy = Visualization::Member::PRIVACY_PRIVATE
      v22.store
      permission22 = v22.permission
      permission22.acl = [ { type: CartoDB::Permission::TYPE_USER,
          entity: {
            id: @user_1.id,
            username: @user_1.username
          },
          access: CartoDB::Permission::ACCESS_READONLY } ]
      v22.stubs(:invalidate_cache).returns(nil)
      permission22.stubs(:entity).returns(v22)
      permission22.stubs(:notify_permissions_change).returns(nil)
      permission22.save
      liked(@user_1).count.should eq 2
      liked_count(@user_1).should eq 2
      liked(@user_2).count.should eq 2
      liked_count(@user_2).should eq 2

      @user_1.unstub(:organization)
      @user_2.unstub(:organization)
    end

    it "checks filtering by 'liked' " do
      restore_vis_backend_to_normal_table_so_relator_works

      user3 = create_user(:quota_in_bytes => 524288000, :table_quota => 500, :private_tables_enabled => true)
      CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(@user_1)

      table1 = Table.new
      table1.user_id = @user_1.id
      table1.name = "viz#{rand(999)}_1"
      table1.save
      table2 = Table.new
      table2.user_id = @user_1.id
      table2.name = "viz#{rand(999)}_2"
      table2.save
      table3 = Table.new
      table3.user_id = @user_1.id
      table3.name = "viz#{rand(999)}_3"
      table3.save
      table4 = Table.new
      table4.user_id = @user_1.id
      table4.name = "viz#{rand(999)}_4"
      table4.save

      table5 = create_table(@user_1, "viz#{rand(999)}_4")
      table6 = create_table(@user_1, "viz#{rand(999)}_4")

      vis2 = table2.table_visualization
      vis2.privacy = Visualization::Member::PRIVACY_PUBLIC
      vis2.store

      vis3 = table3.table_visualization
      vis3.privacy = Visualization::Member::PRIVACY_PUBLIC
      vis3.store

      vis4 = table4.table_visualization
      vis4.privacy.should eq Visualization::Member::PRIVACY_PRIVATE

      vis_link = table5.table_visualization
      vis_link.privacy = Visualization::Member::PRIVACY_LINK
      vis_link.store

      vis_private = table6.table_visualization
      vis_private.privacy = Visualization::Member::PRIVACY_PRIVATE
      vis_private.store

      # vis1 0 likes

      vis2.add_like_from(@user_1.id)
      vis2.add_like_from(@user_2.id)

      vis3.add_like_from(@user_1.id)

      # since vis4 is not public it won't count for users 2 and 3
      vis4.add_like_from(@user_1.id)
      vis4.add_like_from(@user_2.id)
      vis4.add_like_from(user3.id)

      vis_link.add_like_from(user3.id)
      vis_private.add_like_from(user3.id)

      collection = Visualization::Collection.new.fetch({
                                                         user_id: @user_1.id
                                                       })
      collection.count.should eq 6

      collection = Visualization::Collection.new.fetch({
                                                         user_id: @user_1.id,
                                                         only_liked: true,
                                                       })
      collection.count.should eq 3
      ids = collection.map { |vis| vis.id }
      expected_likes = [ vis4.id, vis2.id, vis3.id ]
      ids.should eq expected_likes

      collection = Visualization::Collection.new.fetch({
                                                         user_id: @user_1.id,
                                                         type: Visualization::Member::TYPE_CANONICAL,
                                                         only_liked: true
                                                       })
      collection.count.should eq 3
      ids = collection.map { |vis| vis.id }
      expected_likes = [ vis4.id, vis2.id, vis3.id ]
      ids.should eq expected_likes


      collection = Visualization::Collection.new.fetch({
                                                         user_id: @user_1.id,
                                                         only_liked: true,
                                                         unauthenticated: true
                                                       })
      collection.count.should eq 2
      ids = collection.map { |vis| vis.id }
      expected_likes = [ vis2.id, vis3.id ]
      ids.should eq expected_likes

      collection = Visualization::Collection.new.fetch({
                                                         user_id: @user_1.id,
                                                         only_liked: true,
                                                         privacy: Visualization::Member::PRIVACY_PRIVATE
                                                       })
      collection.count.should eq 1
      ids = collection.map { |vis| vis.id }
      expected_likes = [ vis4.id ]
      ids.should eq expected_likes

      collection = Visualization::Collection.new.fetch({
                                                         only_liked: true
                                                       })
      collection.count.should eq 0

      collection = Visualization::Collection.new.fetch({
                                                         user_id: @user_2.id,
                                                         only_liked: true
                                                       })
      collection.count.should eq 1

      collection = Visualization::Collection.new.fetch({
                                                         user_id: user3.id,
                                                         only_liked: true
                                                       })
      collection.count.should eq 1 # Liked link privacy one

      user3.destroy
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
      collection.count_total(user_id: user1_id, type: CartoDB::Visualization::Member::TYPE_CANONICAL).should eq 2
      collection.count_total(user_id: user1_id, type: CartoDB::Visualization::Member::TYPE_DERIVED).should eq 0

      # And filtering by user_id
      collection.count_total(user_id: user2_id).should eq 2
    end

  end

  # Slide visualization types specs

  # This should be a member_spec test, but as those specs have no collection support...
  it 'checks the .children method' do
    Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)
    userid = UUIDTools::UUID.timestamp_create.to_s

    parent = Visualization::Member.new(random_attributes_for_vis_member({
      user_id: userid,
      type: Visualization::Member::TYPE_DERIVED
    })).store

    parent.children.count.should eq 0

    child1 = Visualization::Member.new(random_attributes_for_vis_member({
      user_id: userid,
      type:      Visualization::Member::TYPE_SLIDE,
      parent_id: parent.id
    })).store.fetch

    parent.children.count.should eq 1

    child2 = Visualization::Member.new(random_attributes_for_vis_member({
      user_id: userid,
      type:      Visualization::Member::TYPE_SLIDE,
      parent_id: parent.id,
    })).store.fetch

    child2.set_prev_list_item!(child1)
    parent.fetch

    parent.children.count.should eq 2

    canonical = Visualization::Member.new(random_attributes_for_vis_member({
      user_id: userid,
      type: Visualization::Member::TYPE_CANONICAL
    })).store

    parent.children.count.should eq 2

    canonical.children.count.should eq 0

    child_2_1 = Visualization::Member.new(random_attributes_for_vis_member({
      user_id: userid,
      type: Visualization::Member::TYPE_DERIVED
    })).store

    Visualization::Member.new(random_attributes_for_vis_member({
      user_id: userid,
      type:      Visualization::Member::TYPE_SLIDE,
      parent_id: child_2_1.id
    })).store

    child_2_1.children.count.should eq 1
  end

  it 'checks retrieving slide type items' do
    userid = UUIDTools::UUID.timestamp_create.to_s
    Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)
    member = Visualization::Member.new(random_attributes_for_vis_member({
      type:     Visualization::Member::TYPE_DERIVED,
      user_id:  userid
    })).store

    Visualization::Member.new(random_attributes_for_vis_member({
      type:       Visualization::Member::TYPE_SLIDE,
      parent_id:  member.id,
      user_id:    userid
    })).store
    Visualization::Member.new(random_attributes_for_vis_member({
      type:       Visualization::Member::TYPE_SLIDE,
      parent_id:  member.id,
      user_id:    userid
    })).store

    collection = Visualization::Collection.new.fetch({
       user_id: userid,
       type:    Visualization::Member::TYPE_SLIDE
    })
    collection.count.should eq 2
  end

  def random_attributes(attributes={})
    random = rand(999)
    {
      name:           attributes.fetch(:name, "name #{random}"),
      description:    attributes.fetch(:description, "description #{random}"),
      privacy:        attributes.fetch(:privacy, 'public'),
      tags:           attributes.fetch(:tags, ['tag 1']),
      type:           attributes.fetch(:type, CartoDB::Visualization::Member::TYPE_CANONICAL),
      user_id:        attributes.fetch(:user_id, UUIDTools::UUID.timestamp_create.to_s),
      locked:         attributes.fetch(:locked, false),
      title:          attributes.fetch(:title, ''),
      source:         attributes.fetch(:source, ''),
      license:        attributes.fetch(:license, ''),
      attributions:   attributes.fetch(:attributions, ''),
      kind:           attributes.fetch(:kind, CartoDB::Visualization::Member::KIND_GEOM),
      map_id:         attributes.fetch(:map_id, nil)
    }
  end #random_attributes
end # Visualization::Collection
