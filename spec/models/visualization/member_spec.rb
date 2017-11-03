# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../visualization_shared_examples'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../app/models/visualization/member'
require_relative '../../../app/models/visualization/collection'
require_relative '../../../services/data-repository/repository'
require_relative '../../doubles/support_tables.rb'
require_dependency 'cartodb/redis_vizjson_cache'

include CartoDB

describe Visualization::Member do
  before(:all) do
    @db = SequelRails.connection
    Sequel.extension(:pagination)

    Visualization.repository  = DataRepository::Backend::Sequel.new(@db, :visualizations)

    @user = FactoryGirl.create(:valid_user)
  end

  after(:all) do
    @user.destroy
  end

  before(:each) do
    bypass_named_maps

    # For relator->permission
    user_id = UUIDTools::UUID.timestamp_create.to_s
    user_name = 'whatever'
    user_apikey = '123'
    @user_mock = mock
    @user_mock.stubs(:id).returns(user_id)
    @user_mock.stubs(:username).returns(user_name)
    @user_mock.stubs(:api_key).returns(user_apikey)
    @user_mock.stubs(:viewer).returns(false)
    @user_mock.stubs(:has_feature_flag?).returns(false)
    @user_mock.stubs(:new_visualizations_version).returns(2)
    CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(@user_mock)

    support_tables_mock = Doubles::Visualization::SupportTables.new
    Visualization::Relator.any_instance.stubs(:support_tables).returns(support_tables_mock)
  end

  it_behaves_like 'visualization models' do
    def build_visualization(attrs = {})
      Visualization::Member.new(attrs)
    end
  end

  describe '#initialize' do
    it 'assigns an id by default' do
      member = Visualization::Member.new
      member.should be_an_instance_of Visualization::Member
      member.id.should_not be_nil
    end
  end

  describe '#store' do

    it 'should fail if no user_id attribute present' do
      attributes  = random_attributes_for_vis_member(user_id: @user_mock.id)
      attributes.delete(:user_id)
      member      = Visualization::Member.new(attributes)
      expect {
        member.store
      }.to raise_exception CartoDB::InvalidMember
    end

    it 'should fail for new visualizations and viewer users' do
      @user_mock.stubs(:viewer).returns(true)
      attributes = random_attributes_for_vis_member(user_id: @user_mock.id)
      member = Visualization::Member.new(attributes)
      expect { member.store }.to raise_error(CartoDB::InvalidMember, /Viewer users can't store visualizations/)

      @user_mock.stubs(:viewer).returns(false)
    end

    it 'should fail for existing visualizations if user is now a viewer' do
      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))
      member.store

      member = Visualization::Member.new(id: member.id).fetch
      @user_mock.stubs(:viewer).returns(true)
      member.name = 'changed'
      expect { member.store }.to raise_error(CartoDB::InvalidMember, /Viewer users can't store visualizations/)

      @user_mock.stubs(:viewer).returns(false)
    end

    it 'persists attributes to the data repository' do
      attributes  = random_attributes_for_vis_member(user_id: @user_mock.id)
      member      = Visualization::Member.new(attributes)
      member.store

      member = Visualization::Member.new(id: member.id)
      member.name.should be_nil

      member.fetch
      member.name             .should == attributes.fetch(:name)
      member.active_layer_id  .should == attributes.fetch(:active_layer_id)
      member.privacy          .should == attributes.fetch(:privacy)

      member.permission.should_not be nil
      member.permission.owner_id.should eq @user_mock.id
      member.permission.owner_username.should eq @user_mock.username
    end

    it 'persists tags as an array if the backend supports it' do
      Permission.any_instance.stubs(:update_shared_entities).returns(nil)

      attributes  = random_attributes_for_vis_member(user_id: @user_mock.id, tags: ['tag 1', 'tag 2'])
      member      = Visualization::Member.new(attributes)
      member.store

      member = Visualization::Member.new(id: member.id)
      member.fetch
      member.tags.should include('tag 1')
      member.tags.should include('tag 2')
      member.delete
    end

    it 'persists tags as JSON if the backend does not support arrays' do
      attributes  = random_attributes_for_vis_member(user_id: @user_mock.id, tags: ['tag 1', 'tag 2'])
      member      = Visualization::Member.new(attributes)
      member.store

      member = Visualization::Member.new(id: member.id)
      member.fetch
      member.tags.should include('tag 1')
      member.tags.should include('tag 2')
    end

    it 'prevents empty tags from being created' do
      attributes = random_attributes_for_vis_member(user_id: @user_mock.id, tags: ['tag 1', '', '   '])
      member = Visualization::Member.new(attributes)
      member.store

      member = Visualization::Member.new(id: member.id)
      member.fetch
      member.tags.should eq ['tag 1']
    end

    it 'invalidates vizjson cache in varnish if name changed' do
      member      = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))
      member.store

      CartoDB::Visualization::NameChecker.any_instance.stubs(:available?).returns(true)

      member = Visualization::Member.new(id: member.id).fetch
      CartoDB::Varnish.any_instance.expects(:purge).with(member.varnish_vizjson_key)
      member.name = 'changed'
      member.store
    end

    it 'invalidates vizjson cache in varnish if privacy changed' do
      # Need to at least have this decorated in the user data or checks before becoming private will raise an error
      CartoDB::Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

      member      = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))
      member.store

      member = Visualization::Member.new(id: member.id).fetch
      CartoDB::Varnish.any_instance.expects(:purge).with(member.varnish_vizjson_key)
      member.privacy = Visualization::Member::PRIVACY_PRIVATE
      member.store
    end

    it 'invalidates vizjson cache in varnish if description changed' do
      member      = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))
      member.store

      member = Visualization::Member.new(id: member.id).fetch
      CartoDB::Varnish.any_instance.expects(:purge).with(member.varnish_vizjson_key)
      member.description = 'changed description'
      member.store
    end
  end

  describe '#fetch' do
    it 'fetches attributes from the data repository' do
      attributes  = random_attributes_for_vis_member(user_id: @user_mock.id)
      member      = Visualization::Member.new(attributes).store
      member      = Visualization::Member.new(id: member.id)
      member.name = 'changed'
      member.fetch
      member.name.should == attributes.fetch(:name)
    end
  end

  describe '#delete' do
    it 'fails for viewer users' do
      CartoDB::Visualization::Relator.any_instance.stubs(:children).returns([])

      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id)).store
      member.fetch

      @user_mock.stubs(:viewer).returns(true)

      expect { member.delete }.to raise_error(CartoDB::InvalidMember, /Viewer users can't delete visualizations/)

      @user_mock.stubs(:viewer).returns(false)
    end

    it 'deletes this member data from the data repository' do
      CartoDB::Visualization::Relator.any_instance.stubs(:children).returns([])

      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id)).store
      member.fetch
      member.name.should_not be_nil

      member.delete
      member.name.should be_nil

      lambda { member.fetch }.should raise_error KeyError
    end

    it 'invalidates vizjson cache' do
      CartoDB::Visualization::Relator.any_instance.stubs(:children).returns([])
      member      = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))
      member.store

      member.expects(:invalidate_cache)
      member.delete
    end

    describe 'dataset' do
      include Carto::Factories::Visualizations

      before(:all) do
        @user = FactoryGirl.create(:carto_user)
        @other_table = FactoryGirl.create(:carto_user_table, user: @user)
      end

      before(:each) do
        @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
        @visualization.data_layers.first.user_tables << @table
      end

      after(:each) do
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      end

      after(:all) do
        @user.destroy
      end

      it 'destroys maps if they are dependent' do
        table_visualization = CartoDB::Visualization::Member.new(id: @table_visualization.id).fetch
        table_visualization.delete

        Carto::Visualization.exists?(@visualization.id).should be_false
      end

      it 'destroys maps with join analyses if they are dependent' do
        # First layer uses tables @table, Second layer uses tables @table and @other_table. Map is dependent on @table
        layer = FactoryGirl.build(:carto_layer, kind: 'carto', maps: [@map])
        layer.options[:query] = "SELECT * FROM #{@other_table.name}"
        layer.save
        layer.user_tables << @table << @other_table

        table_visualization = CartoDB::Visualization::Member.new(id: @table_visualization.id).fetch
        table_visualization.delete

        Carto::Visualization.exists?(@visualization.id).should be_false
      end

      it 'unlinks only dependent data layers' do
        layer_to_be_deleted = @visualization.data_layers.first
        layer = FactoryGirl.build(:carto_layer, kind: 'carto', maps: [@map])
        layer.options[:query] = "SELECT * FROM #{@other_table.name}"
        layer.save
        layer.user_tables << @other_table

        table_visualization = CartoDB::Visualization::Member.new(id: @table_visualization.id).fetch
        table_visualization.delete

        Carto::Visualization.exists?(@visualization.id).should be_true
        Carto::Layer.exists?(layer_to_be_deleted.id).should be_false
        Carto::Layer.exists?(layer.id).should be_true
      end

      it 'deletes related analysis' do
        layer_to_be_deleted = @visualization.data_layers.first
        layer_to_be_deleted.options[:source] = 'a0'
        layer_to_be_deleted.save
        layer_to_be_deleted.user_tables << @table

        layer = FactoryGirl.build(:carto_layer, kind: 'carto', maps: [@map])
        layer.options[:source] = 'b0'
        layer.save
        layer.user_tables << @other_table

        # We are doing dependencies manually because the physical table does not exist
        Carto::Map.any_instance.stubs(:update_dataset_dependencies)
        analysis_to_be_deleted = @visualization.analyses.create(user: @user, analysis_definition: { id: 'a0' })
        analysis_to_keep = @visualization.analyses.create(user: @user, analysis_definition: { id: 'b0' })

        table_visualization = CartoDB::Visualization::Member.new(id: @table_visualization.id).fetch
        table_visualization.delete

        Carto::Visualization.exists?(@visualization.id).should be_true
        Carto::Layer.exists?(layer_to_be_deleted.id).should be_false
        Carto::Layer.exists?(layer.id).should be_true
        Carto::Analysis.exists?(analysis_to_be_deleted.id).should be_false
        Carto::Analysis.exists?(analysis_to_keep.id).should be_true
      end

      it 'does not delete any metadata in case of deletion error' do
        canonical_map = @table_visualization.map
        canonical_layer = @table_visualization.data_layers.first
        Table.any_instance.stubs(:remove_table_from_user_database).raises(Sequel::DatabaseError.new('cannot drop'))

        table_visualization = CartoDB::Visualization::Member.new(id: @table_visualization.id).fetch
        expect { table_visualization.delete }.to raise_error

        Carto::Visualization.exists?(@visualization.id).should be_true
        Carto::Visualization.exists?(@table_visualization.id).should be_true
        Carto::Layer.exists?(canonical_layer.id).should be_true
        Carto::UserTable.exists?(@table.id).should be_true
        Carto::Map.exists?(canonical_map.id).should be_true

        Table.any_instance.unstub(:remove_table_from_user_database)
      end
    end
  end

  describe '#unlink_from' do
    it 'invalidates varnish cache' do
      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id)).store
      member.expects(:invalidate_cache)
      member.expects(:remove_layers_from)
      member.unlink_from(Object.new)
    end
  end

  describe '#public?' do
    it 'returns true if privacy set to public' do
      visualization = Visualization::Member.new(privacy: 'public')
      visualization.public?.should == true

      visualization.privacy = Visualization::Member::PRIVACY_PRIVATE
      visualization.public?.should == false

      visualization.privacy = Visualization::Member::PRIVACY_PUBLIC
      visualization.public?.should == true
    end
  end

  describe '#permissions' do
    it 'checks is_owner? permissions' do
      user_id  = UUIDTools::UUID.timestamp_create.to_s
      member  = Visualization::Member.new(name: 'foo', user_id: user_id)

      user    = OpenStruct.new(id: user_id)
      member.is_owner?(user).should == true

      user    = OpenStruct.new(id: UUIDTools::UUID.timestamp_create.to_s)
      member.is_owner?(user).should == false
    end

    def mock_user(username, viewer: false)
      user_mock = mock
      user_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user_mock.stubs(:username).returns(username)
      user_mock.stubs(:organization).returns(nil)
      user_mock.stubs(:viewer).returns(viewer)
      user_mock
    end

    it 'checks has_permission? permissions' do
      Permission.any_instance.stubs(:grant_db_permission).returns(nil)

      Permission.any_instance.stubs(:notify_permissions_change).returns(nil)

      user2_mock = mock_user('user2')
      user3_mock = mock_user('user3')
      user4_mock = mock_user('user4')
      viewer_user = mock_user('user_v', viewer: true)

      visualization = Visualization::Member.new(
          privacy: Visualization::Member::PRIVACY_PUBLIC,
          name: 'test',
          type: Visualization::Member::TYPE_CANONICAL,
          user_id: @user.id
      )
      visualization.store

      permission = Permission.where(id: visualization.permission_id).first

      acl = [
        {
          type: Permission::TYPE_USER,
          entity: {
            id: user2_mock.id,
            username: user2_mock.username
          },
          access: Permission::ACCESS_READONLY
        },
        {
          type: Permission::TYPE_USER,
          entity: {
            id: user3_mock.id,
            username: user3_mock.username
          },
          access: Permission::ACCESS_READWRITE
        },
        {
          type: Permission::TYPE_USER,
          entity: {
            id: viewer_user.id,
            username: viewer_user.username
          },
          access: Permission::ACCESS_READWRITE
        }
      ]
      acl_expected = [
        {
          type: Permission::TYPE_USER,
          id: user2_mock.id,
          access: Permission::ACCESS_READONLY
        },
        {
          type: Permission::TYPE_USER,
          id: user3_mock.id,
          access: Permission::ACCESS_READWRITE
        },
        {
          type: Permission::TYPE_USER,
          id: viewer_user.id,
          access: Permission::ACCESS_READWRITE
        }
      ]

      permission.acl = acl
      permission.save
      visualization.permission.acl.should eq acl_expected

      visualization.has_permission?(user2_mock, Visualization::Member::PERMISSION_READONLY).should eq true
      visualization.has_permission?(user2_mock, Visualization::Member::PERMISSION_READWRITE).should eq false

      visualization.has_permission?(user3_mock, Visualization::Member::PERMISSION_READONLY).should eq true
      visualization.has_permission?(user3_mock, Visualization::Member::PERMISSION_READWRITE).should eq true

      visualization.has_permission?(user4_mock, Visualization::Member::PERMISSION_READONLY).should eq false
      visualization.has_permission?(user4_mock, Visualization::Member::PERMISSION_READWRITE).should eq false

      # Viewer users hasn't RW permission even though granted
      visualization.has_permission?(viewer_user, Visualization::Member::PERMISSION_READWRITE).should eq false

      delete_user_data(@user)
    end
  end

  describe 'validations' do
    describe '#privacy' do
      it 'must be present' do
        visualization = Visualization::Member.new
        visualization.valid?.should == false
        visualization.errors.fetch(:privacy).should_not be_nil
      end

      it 'must be valid' do
        visualization = Visualization::Member.new(privacy: 'wadus')
        visualization.valid?.should == false
        visualization.errors.fetch(:privacy).should_not be_nil
      end
    end

    describe '#name' do
      it 'downcases names for table_visualizations' do
        visualization = Visualization::Member.new(type: 'table')
        visualization.name = 'visualization_1'
        visualization.name.should == 'visualization_1'
        visualization.name = 'Visualization_1'
        visualization.name.should == 'visualization_1'

        visualization = Visualization::Member.new(type: 'derived')
        visualization.name = 'Visualization 1'
        visualization.name.should == 'Visualization 1'
      end
    end

    describe '#full_errors' do
      it 'returns full error messages' do
        visualization = Visualization::Member.new
        visualization.valid?.should == false

        visualization.full_errors.join("\n").should =~ /privacy/
        visualization.full_errors.join("\n").should =~ /type/
        visualization.full_errors.join("\n").should =~ /name/
      end
    end
  end

  describe '#derived?' do
    it 'returns true if type is derived' do
      visualization = Visualization::Member.new(type: Visualization::Member::TYPE_DERIVED)
      visualization.derived?.should be_true
      visualization.table?.should be_false
      visualization.type_slide?.should be_false

      visualization.type = 'bogus'
      visualization.derived?.should be_false
      visualization.table?.should be_false
      visualization.type_slide?.should be_false
    end
  end

  describe '#table?' do
    it "returns true if type is 'table'" do
      visualization = Visualization::Member.new(type: Visualization::Member::TYPE_CANONICAL)
      visualization.derived?.should be_false
      visualization.table?.should be_true
      visualization.type_slide?.should be_false

      visualization.type = 'bogus'
      visualization.derived?.should be_false
      visualization.table?.should be_false
      visualization.type_slide?.should be_false
    end
  end

  describe '#type_slide?' do
    it "returns true if type is 'slide'" do
      visualization = Visualization::Member.new(type: Visualization::Member::TYPE_SLIDE)
      visualization.derived?.should be_false
      visualization.table?.should be_false
      visualization.type_slide?.should be_true

      visualization.type = 'bogus'
      visualization.derived?.should be_false
      visualization.table?.should be_false
      visualization.type_slide?.should be_false
    end
  end

  describe '#privacy_and_exceptions' do
    it 'checks different privacy options to make sure exceptions are raised when they should' do
      user_id = UUIDTools::UUID.timestamp_create.to_s

      visualization = Visualization::Member.new(type: Visualization::Member::TYPE_DERIVED)
      visualization.name = 'test'
      visualization.user_id = user_id

      @user_mock.stubs(:invalidate_varnish_cache)


      # Private maps allowed
      @user_mock.stubs(:private_maps_enabled?).returns(true)

      # Forces internal "dirty" flag
      visualization.privacy = Visualization::Member::PRIVACY_PUBLIC
      visualization.privacy = Visualization::Member::PRIVACY_PRIVATE

      visualization.store

      # -------------

      # No private maps allowed
      @user_mock.stubs(:private_maps_enabled?).returns(false)

      visualization.privacy = Visualization::Member::PRIVACY_PUBLIC
      visualization.privacy = Visualization::Member::PRIVACY_PRIVATE

      # Derived table without private maps flag = error
      expect {
        visualization.store
      }.to raise_exception CartoDB::InvalidMember

      # -------------

      visualization = Visualization::Member.new(type: Visualization::Member::TYPE_CANONICAL)
      visualization.name = 'test'
      visualization.user_id = user_id
      # No private maps allowed yet

      visualization.privacy = Visualization::Member::PRIVACY_PUBLIC
      visualization.privacy = Visualization::Member::PRIVACY_PRIVATE

      # Canonical visualizations can always be private
      visualization.store
    end
  end

  describe '#validation_for_link_privacy' do
    it 'checks that only users with private tables enabled can set LINK privacy' do
      user_id = UUIDTools::UUID.timestamp_create.to_s
      Visualization::Member.any_instance.stubs(:named_maps)

      visualization = Visualization::Member.new(
          privacy: Visualization::Member::PRIVACY_PUBLIC,
          name:     'test',
          type:     Visualization::Member::TYPE_CANONICAL,
          user_id:  user_id
      )
      @user_mock.stubs(:private_maps_enabled?).returns(true)

      # Careful, do a user mock after touching user_data as it does some checks about user too
      user_mock = mock
      user_mock.stubs(:viewer).returns(false)
      user_mock.stubs(:private_tables_enabled).returns(true)
      user_mock.stubs(:id).returns(user_id)
      Visualization::Member.any_instance.stubs(:user).returns(user_mock)

      visualization.valid?.should eq true

      visualization.privacy = Visualization::Member::PRIVACY_PRIVATE
      visualization.valid?.should eq true


      visualization.privacy = Visualization::Member::PRIVACY_LINK
      visualization.valid?.should eq true

      visualization.privacy = Visualization::Member::PRIVACY_PUBLIC

      user_mock.stubs(:private_tables_enabled).returns(false)

      visualization.valid?.should eq true

      visualization.privacy = Visualization::Member::PRIVACY_LINK
      visualization.valid?.should eq false

      # "Reset"
      visualization = Visualization::Member.new(
          privacy: Visualization::Member::PRIVACY_LINK,
          name: 'test',
          type: Visualization::Member::TYPE_CANONICAL,
          user_id:  user_id
      )
      # Unchanged visualizations could be
      visualization.valid?.should eq true

      # Simulate editing the privacy
      visualization.stubs(:privacy_changed).returns(true)
      # Now it can't
      visualization.valid?.should eq false
    end
  end

  describe '#default_privacy_values' do
    it 'Checks deault privacies for visualizations' do
      user_id = UUIDTools::UUID.timestamp_create.to_s
      user_mock = mock
      user_mock.stubs(:id).returns(user_id)

      # We don't care about values, just want an instance
      visualization = Visualization::Member.new(
          privacy: Visualization::Member::PRIVACY_PUBLIC,
          name: 'test',
          type: Visualization::Member::TYPE_CANONICAL,
          user_id: user_id
      )

      user_mock.stubs(:private_tables_enabled).returns(true)
      visualization.stubs(:user).returns(user_mock)
      visualization.default_privacy.should eq Visualization::Member::PRIVACY_LINK

      user_mock.stubs(:private_tables_enabled).returns(false)
      visualization.stubs(:user).returns(user_mock)
      visualization.default_privacy.should eq Visualization::Member::PRIVACY_PUBLIC
    end
  end

  it 'should not allow to change permission from the outside' do
    member = Visualization::Member.new(random_attributes_for_vis_member({user_id: @user.id}))
    member.store
    member = Visualization::Member.new(id: member.id).fetch
    member.permission.should_not be nil
    member.permission_id = UUIDTools::UUID.timestamp_create.to_s
    member.valid?.should eq false
    delete_user_data(@user)
  end

  describe '#likes' do
    it 'should properly relate likes to a visualization' do
      user_id = UUIDTools::UUID.timestamp_create.to_s
      user_mock = mock
      user_mock.stubs(:id).returns(user_id)

      user_id_2 = UUIDTools::UUID.timestamp_create.to_s
      user_id_3 = UUIDTools::UUID.timestamp_create.to_s
      user_id_4 = UUIDTools::UUID.timestamp_create.to_s

      member = Visualization::Member.new(random_attributes_for_vis_member({user_id: user_id}))
      member.store.fetch

      member.likes.count.should eq 0

      member.liked_by?(user_id_2).should eq false

      member.add_like_from(user_id_2)
      member.likes.count.should eq 1
      member.likes.select.select { |like| like.actor == user_id_2 }.count.should eq 1
      member.likes.select.select { |like| like.actor == user_id_4 }.count.should eq 0

      member.liked_by?(user_id_2).should eq true
      member.liked_by?(user_id_3).should eq false

      expect {
        member.add_like_from(user_id_2)
      }.to raise_error AlreadyLikedError

      member.add_like_from(user_id_3)
      member.likes.count.should eq 2
      member.likes.select.select { |like| like.actor == user_id_2 }.count.should eq 1
      member.likes.select.select { |like| like.actor == user_id_3 }.count.should eq 1
      member.likes.select.select { |like| like.actor == user_id_4 }.count.should eq 0

      member.liked_by?(user_id_2).should eq true
      member.liked_by?(user_id_3).should eq true

      member.remove_like_from(user_id_3)

      member.likes.count.should eq 1
      member.likes.select.select { |like| like.actor == user_id_3 }.count.should eq 0
      member.likes.select.select { |like| like.actor == user_id_2 }.count.should eq 1
      member.likes.select.select { |like| like.actor == user_id_4 }.count.should eq 0

      member.liked_by?(user_id_2).should eq true
      member.liked_by?(user_id_3).should eq false

      member.remove_like_from(user_id_2)
      member.likes.count.should eq 0

      member.remove_like_from(user_id_2)

    end
  end

  it 'checks that slides can have a parent_id' do
    Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

    expected_errors = { parent_id: 'Type slide must have a parent' }

    member = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                          type: Visualization::Member::TYPE_DERIVED }))
    member.store

    member = Visualization::Member.new(id: member.id).fetch
    member.parent_id.should be nil
    member.parent.should be nil

    child_member = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                                type: Visualization::Member::TYPE_SLIDE }))
    # Can't save a children of type slide without parent_id
    expect {
      child_member.store
    }.to raise_exception InvalidMember
    child_member.valid?.should eq false
    child_member.errors.should eq expected_errors

    child_member = Visualization::Member.new(random_attributes_for_vis_member({
      user_id: @user_mock.id,
      type:       Visualization::Member::TYPE_SLIDE,
      parent_id:  member.id
    }))
    child_member.store

    child_member = Visualization::Member.new(id: child_member.id).fetch
    child_member.type.should eq Visualization::Member::TYPE_SLIDE
    child_member.parent_id.should eq member.id
    child_member.parent.id.should eq member.id

    expect {
      table_member = Visualization::Member.new(
        random_attributes_for_vis_member({
                                           user_id: @user_mock.id,
                                           type: Visualization::Member::TYPE_CANONICAL,
                                           parent_id: member.id
                                         }))
      table_member.store
    }.to raise_exception CartoDB::InvalidMember
    expect {
      table_member = Visualization::Member.new(
        random_attributes_for_vis_member({
                                           user_id: @user_mock.id,
                                           type:       Visualization::Member::TYPE_DERIVED,
                                           parent_id:  member.id
                                         }))
      table_member.store
    }.to raise_exception CartoDB::InvalidMember

    child_member = Visualization::Member.new(
      random_attributes_for_vis_member({
                                          user_id: @user_mock.id,
                                          type:       Visualization::Member::TYPE_SLIDE,
                                          parent_id:  UUIDTools::UUID.timestamp_create.to_s
                                        }))
    expect {
      child_member.store
    }.to raise_exception CartoDB::InvalidMember

    member_2 = Visualization::Member.new(
                                         random_attributes_for_vis_member({ user_id: @user_mock.id,
                                         type: Visualization::Member::TYPE_CANONICAL }))
    member_2.store.fetch
    child_member.parent_id = member_2.id
    expect {
      child_member.store
    }.to raise_exception InvalidMember

  end

  it 'tests transition_options field jsonification' do
    Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

    transition_options = { first: true, second: 6 }

    member = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                          transition_options: transition_options }))

    member.transition_options.should eq transition_options
    member.slide_transition_options.should eq ::JSON.dump(transition_options)

    transition_options[:third] = 'testing'

    member.transition_options = transition_options

    member.transition_options.should eq transition_options
    member.slide_transition_options.should eq ::JSON.dump(transition_options)

    member = member.store.fetch
    member.transition_options.should eq transition_options
    member.slide_transition_options.should eq ::JSON.dump(transition_options)
  end

  describe '#linked_list_tests' do
    it 'checks set_next! and unlink_self_from_list! on visualizations when set' do
      Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

      member_a = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                              name:'A',
                                                                              type: Visualization::Member::TYPE_DERIVED }))
      member_a = member_a.store.fetch
      member_b = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                              name:'B',
                                                                              type: Visualization::Member::TYPE_DERIVED }))
      member_b = member_b.store.fetch
      member_c = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                              name:'C',
                                                                              type: Visualization::Member::TYPE_DERIVED }))
      member_c = member_c.store.fetch
      member_d = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                              name:'D',
                                                                              type: Visualization::Member::TYPE_DERIVED }))
      member_d = member_d.store.fetch

      # A
      member_a.prev_id.should eq nil
      member_a.prev_list_item.should eq nil
      member_a.next_id.should eq nil
      member_a.next_list_item.should eq nil

      # A -> B
      member_a.set_next_list_item! member_b

      member_a.next_list_item.should eq member_b
      member_a.prev_list_item.should eq nil
      member_b.prev_list_item.should eq member_a
      member_b.next_list_item.should eq nil

      # A -> B -> C
      member_b.set_next_list_item! member_c

      # set_next reloads "actor and subject", but other affected items need to be reloaded
      member_a.fetch

      member_a.prev_list_item.should eq nil
      member_a.next_list_item.should eq member_b
      member_b.prev_list_item.should eq member_a
      member_b.next_list_item.should eq member_c
      member_c.prev_list_item.should eq member_b
      member_c.next_list_item.should eq nil

      # A -> D -> B -> C
      member_a.set_next_list_item! member_d

      member_b.fetch
      member_c.fetch

      member_a.prev_list_item.should eq nil
      member_a.next_list_item.should eq member_d
      member_d.prev_list_item.should eq member_a
      member_d.next_list_item.should eq member_b
      member_b.prev_list_item.should eq member_d
      member_b.next_list_item.should eq member_c
      member_c.prev_list_item.should eq member_b
      member_c.next_list_item.should eq nil

      member_a.next_list_item.next_list_item.should eq member_b
      member_a.next_list_item.next_list_item.next_list_item.should eq member_c
      member_a.next_list_item.next_list_item.next_list_item.next_list_item.should eq nil

      # A -> D -> C
      member_b.delete
      # triggers unlink_self_from_list! inside, should reorder remaining items

      member_c.fetch
      member_d.fetch

      member_a.prev_list_item.should eq nil
      member_a.next_list_item.should eq member_d
      member_d.prev_list_item.should eq member_a
      member_d.next_list_item.should eq member_c
      member_c.prev_list_item.should eq member_d
      member_c.next_list_item.should eq nil

      # D -> C
      member_a.delete

      member_d.fetch

      member_d.prev_list_item.should eq nil
      member_d.next_list_item.should eq member_c
      member_c.prev_list_item.should eq member_d
      member_c.next_list_item.should eq nil

      # D
      member_c.delete

      member_d.fetch

      member_d.prev_list_item.should eq nil
      member_d.next_list_item.should eq nil

      member_d.delete
    end

    it 'checks reordering visualizations items' do
      Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

      member_a = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                              name:'A',
                                                                              type: Visualization::Member::TYPE_DERIVED }))
      member_a = member_a.store.fetch
      member_b = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                              name:'B',
                                                                              type: Visualization::Member::TYPE_DERIVED }))
      member_b = member_b.store.fetch
      member_c = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                              name:'C',
                                                                              type: Visualization::Member::TYPE_DERIVED }))
      member_c = member_c.store.fetch
      member_d = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                              name:'D',
                                                                              type: Visualization::Member::TYPE_DERIVED }))
      member_d = member_d.store.fetch
      member_e = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                              name:'E',
                                                                              type: Visualization::Member::TYPE_DERIVED }))
      member_e = member_e.store.fetch

      # A -> B
      member_a.set_next_list_item! member_b
      # A -> B -> C
      member_b.set_next_list_item! member_c
      member_a.fetch
      # A -> B -> C -> D
      member_c.set_next_list_item! member_d
      member_a.fetch
      member_b.fetch
      # A -> B -> C -> D -> E
      member_d.set_next_list_item! member_e
      member_a.fetch
      member_b.fetch
      member_c.fetch

      member_a.prev_list_item.should eq nil
      member_a.next_list_item.should eq member_b
      member_b.prev_list_item.should eq member_a
      member_b.next_list_item.should eq member_c
      member_c.prev_list_item.should eq member_b
      member_c.next_list_item.should eq member_d
      member_d.prev_list_item.should eq member_c
      member_d.next_list_item.should eq member_e
      member_e.prev_list_item.should eq member_d
      member_e.next_list_item.should eq nil

      # Actual reordering starts here
      # -----------------------------

      # B -> A -> C -> D -> E
      member_b.set_next_list_item! member_a

      member_c.fetch

      member_b.prev_list_item.should eq nil
      member_b.next_list_item.should eq member_a
      member_a.prev_list_item.should eq member_b
      member_a.next_list_item.should eq member_c
      member_c.prev_list_item.should eq member_a
      member_c.next_list_item.should eq member_d
      member_d.prev_list_item.should eq member_c
      member_d.next_list_item.should eq member_e
      member_e.prev_list_item.should eq member_d
      member_e.next_list_item.should eq nil

      # B -> A -> D -> E -> C
      member_e.set_next_list_item! member_c

      member_a.fetch
      member_d.fetch

      member_b.prev_list_item.should eq nil
      member_b.next_list_item.should eq member_a
      member_a.prev_list_item.should eq member_b
      member_a.next_list_item.should eq member_d
      member_d.prev_list_item.should eq member_a
      member_d.next_list_item.should eq member_e
      member_e.prev_list_item.should eq member_d
      member_e.next_list_item.should eq member_c
      member_c.prev_list_item.should eq member_e
      member_c.next_list_item.should eq nil

      # B -> E -> A -> D -> C

      member_b.set_next_list_item! member_e

      member_a.fetch
      member_c.fetch
      member_d.fetch

      member_b.prev_list_item.should eq nil
      member_b.next_list_item.should eq member_e
      member_e.prev_list_item.should eq member_b
      member_e.next_list_item.should eq member_a
      member_a.prev_list_item.should eq member_e
      member_a.next_list_item.should eq member_d
      member_d.prev_list_item.should eq member_a
      member_d.next_list_item.should eq member_c
      member_c.prev_list_item.should eq member_d
      member_c.next_list_item.should eq nil

      # Cleanup
      member_a.delete
      member_b.fetch
      member_b.delete
      member_c.fetch
      member_c.delete
      member_d.fetch
      member_d.delete
      member_e.fetch
      member_e.delete
    end

    it 'checks that upon destruction children are destroyed too' do
      Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)
      support_tables_mock = Doubles::Visualization::SupportTables.new
      Visualization::Relator.any_instance.stubs(:support_tables).returns(support_tables_mock)

      starting_collection_count = Visualization::Collection.new.fetch.count

      parent = Visualization::Member.new(random_attributes_for_vis_member({
                                                             user_id: @user_mock.id,
                                                             name: 'PARENT',
                                                             type: Visualization::Member::TYPE_DERIVED
                                                           })).store

      child1 = Visualization::Member.new(random_attributes_for_vis_member({
                                                             user_id: @user_mock.id,
                                                             name: 'CHILD 1',
                                                             type: Visualization::Member::TYPE_SLIDE,
                                                             parent_id:  parent.id
                                                           })).store.fetch
      child2 = Visualization::Member.new(random_attributes_for_vis_member({
                                                             user_id: @user_mock.id,
                                                             name: 'CHILD 2',
                                                             type: Visualization::Member::TYPE_SLIDE,
                                                             parent_id:  parent.id
                                                           })).store.fetch

      child2.set_prev_list_item!(child1)
      parent.fetch

      parent.delete

      Visualization::Collection.new.fetch.count.should eq starting_collection_count
    end

    it 'checks transactional wrappings for prev-next' do
      Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

      member_a = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                              name:'A',
                                                                              type: Visualization::Member::TYPE_DERIVED }))
      member_a = member_a.store.fetch
      member_b = Visualization::Member.new(random_attributes_for_vis_member({ user_id: @user_mock.id,
                                                                              name:'B',
                                                                              type: Visualization::Member::TYPE_DERIVED }))
      member_b = member_b.store.fetch

      # trick to not stub but also check that validator and other internal fields are reset upon fetch, etc.
      member_b.privacy = 'invalid value'

      expect {
        member_a.set_next_list_item! member_b
      }.to raise_error

      member_a.fetch
      member_b.fetch
      member_a.next_id.should eq nil
      member_b.prev_id.should eq nil
      member_b.privacy.should eq Visualization::Member::PRIVACY_PUBLIC


      member_b.privacy = 'invalid value'

      expect {
        member_b.set_prev_list_item! member_a
      }.to raise_error

      member_a.fetch
      member_b.fetch
      member_a.next_id.should eq nil
      member_b.prev_id.should eq nil
      member_b.privacy.should eq Visualization::Member::PRIVACY_PUBLIC


      member_a.set_next_list_item! member_b
      member_a.privacy = 'invalid value'

      CartoDB::Visualization::Relator.any_instance.stubs(:next_list_item) do
        raise "Forced error"
      end

      expect {
        member_a.unlink_self_from_list!
      }.to raise_error

      member_a = member_a.fetch
      member_b = member_b.fetch
      member_a.next_id.should eq member_b.id
      member_b.prev_id.should eq member_a.id
    end
  end

  describe '#to_vizjson' do
    it "calculates and returns the vizjson if not cached" do
      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))
      member.store
      mocked_vizjson = {mocked: 'vizjson'}
      member.expects(:calculate_vizjson).returns(mocked_vizjson).once

      member.to_vizjson.should eq mocked_vizjson
    end

    it "Returns the vizjson if it was cached before" do
      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))
      member.store
      mocked_vizjson = {mocked: 'vizjson'}
      member.expects(:calculate_vizjson).returns(mocked_vizjson).once

      vizjson = member.to_vizjson # calculate and cache
      member.to_vizjson.should eq vizjson
    end
  end

  describe '#redis_cached' do
    it "Uses the block given to calculate a hash if there's a cache miss" do
      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))

      redis_cache = mock
      redis_cache.expects(:get).returns(nil).once # cache miss
      redis_cache.expects(:setex).once
      Visualization::RedisVizjsonCache.any_instance.stubs(:redis).returns(redis_cache)

      any_hash = {
        any_key: 'any_value'
      }
      member.expects(:calculate_vizjson).once.returns(any_hash)

      member.to_vizjson.should eq any_hash
    end

    it "Caches an arbitrary hash serialized if there's a miss " do
      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))

      any_hash = {
        any_key: 'any_value'
      }

      key = 'any_key'
      Visualization::RedisVizjsonCache.any_instance.stubs(:key).returns(key)
      redis_cache = mock
      redis_cache.expects(:get).returns(nil).once # cache miss
      redis_cache.expects(:setex).once.with(key, 24.hours.to_i, any_hash.to_json)
      Visualization::RedisVizjsonCache.any_instance.stubs(:redis).returns(redis_cache)
      member.expects(:calculate_vizjson).once.returns(any_hash)

      member.to_vizjson.should eq any_hash
    end

    it "Deserializes an arbitrary hash previously stored if there's a cache hit" do
      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))

      any_hash = {
        any_key: 'any_value'
      }
      any_hash_serialized = any_hash.to_json

      key = 'any_key'
      redis_cache = mock
      redis_cache.expects(:get).returns(any_hash_serialized).once # cache hit
      redis_cache.expects(:setex).never
      Visualization::RedisVizjsonCache.any_instance.stubs(:redis).returns(redis_cache)
      member.expects(:calculate_vizjson).never

      member.to_vizjson.should eq any_hash
    end

    it "Does not execute the block if there's a cache hit" do
      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))

      any_hash_serialized = {}.to_json

      key = 'any_key'
      redis_cache = mock
      redis_cache.expects(:get).once.returns(any_hash_serialized) # cache hit
      redis_cache.expects(:setex).never
      Visualization::RedisVizjsonCache.any_instance.stubs(:redis).returns(redis_cache)
      member.expects(:calculate_vizjson).never

      member.to_vizjson
    end
  end

  describe '#invalidate_cache' do
    it "Invalidates the varnish and redis caches" do
      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))
      member.expects(:invalidate_varnish_vizjson_cache).once
      member.expects(:invalidate_redis_cache).once

      member.invalidate_cache
    end
  end

  describe '#invalidate_redis_cache' do
    it "Invalidates the vizjson in redis cache" do
      member = Visualization::Member.new(random_attributes_for_vis_member(user_id: @user_mock.id))
      member.store
      mocked_vizjson = {mocked: 'vizjson'}
      member.expects(:calculate_vizjson).returns(mocked_vizjson).once

      vizjson = member.to_vizjson
      redis_vizjson_cache = Visualization::RedisVizjsonCache.new($tables_metadata)
      redis_key = redis_vizjson_cache.key(member.id)
      redis_vizjson_cache.send(:redis).get(redis_key).should eq vizjson.to_json

      member.invalidate_cache
      redis_vizjson_cache.send(:redis).get(redis_key).should be_nil
    end
  end

  describe 'licenses' do

    before(:all) do
      @user = create_user
    end

    after(:all) do
      @user.delete
    end

    it 'should store correctly a visualization with its license' do
      table = create_table({:name => 'table1', :user_id => @user.id})
      vis = CartoDB::Visualization::Member.new(id: table.table_visualization.id).fetch
      vis.license = "apache"
      vis.store
      vis.fetch
      vis.license_info.id.should eq :apache
      vis.license_info.name.should eq "Apache license"
    end

    it 'should return nil if the license is nil, empty or unkown' do
      table = create_table({:name => 'table1', :user_id => @user.id})
      vis = CartoDB::Visualization::Member.new(id: table.table_visualization.id).fetch
      vis.license = nil
      vis.store
      vis.fetch
      vis.license_info.nil?.should eq true
      vis.license = ""
      vis.store
      vis.fetch
      vis.license_info.nil?.should eq true
      # I cant save with a wrong value
      vis.stubs(:license).returns("lololo")
      vis.license_info.nil?.should eq true
    end

    it 'should raise exception when try to store a unknown license, empty or nil' do
      table = create_table({:name => 'table1', :user_id => @user.id})
      vis = CartoDB::Visualization::Member.new(id: table.table_visualization.id).fetch
      vis.license = "wadus"
      expect {
        vis.store
      }.to raise_error CartoDB::InvalidMember
      vis.license = ""
      expect {
        vis.store
      }.to raise_error CartoDB::InvalidMember
      vis.license = nil
      expect {
        vis.store
      }.to raise_error CartoDB::InvalidMember
    end
  end
  describe 'remote member' do
    before(:all) do
      @user = create_user
      @name = "example_name"
      @display_name = "Example display name"
      @user_id = @user.id
      @privacy = "public"
      @description = "Example description"
      @tags = ["tag1", "tag2"]
      @license = "apache"
      @source = "[source](http://www.example.com)"
      @attributions = "Attributions example"
    end

    it 'should create a new remote member' do
      remote_member = CartoDB::Visualization::Member.remote_member(
        @name, @user_id, @privacy, @description, @tags, @license, @source, @attributions, @display_name
      )
      remote_member.name.should eq @name
      remote_member.user_id.should eq @user_id
      remote_member.privacy.should eq @privacy
      remote_member.description.should eq @description
      remote_member.tags.should eq @tags
      remote_member.license.should eq @license
      remote_member.source.should eq @source
      remote_member.attributions.should eq @attributions
      remote_member.display_name.should eq @display_name
    end
  end
end
