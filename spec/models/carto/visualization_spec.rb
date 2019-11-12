require_relative '../../spec_helper'
require_relative '../visualization_shared_examples'
require_relative '../../../app/models/visualization/member'
require_relative '../../support/factories/organizations'
require 'helpers/unique_names_helper'
require 'helpers/visualization_destruction_helper'

describe Carto::Visualization do
  include UniqueNamesHelper
  include VisualizationDestructionHelper
  include Carto::Factories::Visualizations

  before(:all) do
    @user = create_user
    @carto_user = Carto::User.find(@user.id)
    @user2 = create_user
    @carto_user2 = Carto::User.find(@user2.id)
  end

  before(:each) do
    bypass_named_maps
    delete_user_data(@user)
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
    @user2.destroy
  end

  it_behaves_like 'visualization models' do
    def build_visualization(attrs = {})
      v = Carto::Visualization.new
      v.assign_attributes(attrs, without_protection: true)
      v
    end
  end

  describe '#valid?' do
    it 'validates visualization member with proper type' do
      map = ::Map.create(user_id: @user.id)

      CartoDB::Visualization::Member::VALID_TYPES.each do |type|
        parent = nil
        if type == CartoDB::Visualization::Member::TYPE_SLIDE
          parent = CartoDB::Visualization::Member.new(
            user_id: @user.id,
            name:    unique_name('viz'),
            map_id:  map.id,
            type:    CartoDB::Visualization::Member::TYPE_DERIVED,
            privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
          ).store
        end

        viz = CartoDB::Visualization::Member.new(
          user_id: @user.id,
          name:    unique_name('viz'),
          map_id:  map.id,
          type:    type,
          parent_id: parent.try(:id),
          privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
        )

        viz.valid?.should be_true
      end
    end

    it 'validates carto visualization with proper type' do
      map = ::Map.create(user_id: @user.id)

      Carto::Visualization::VALID_TYPES.each do |type|
        viz = Carto::Visualization.new(
          user_id: @user.id,
          name:    unique_name('viz'),
          map_id:  map.id,
          type:    type,
          privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
        )

        viz.valid?.should be_true
      end
    end

    it 'throws error if not valid type' do
      map = ::Map.create(user_id: @user.id)

      viz = CartoDB::Visualization::Member.new(
        user_id: @user.id,
        name:    unique_name('viz'),
        map_id:  map.id,
        type:    'whatever',
        privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
      )

      viz.valid?.should be_false

      expect {
        viz.store
      }.to raise_error(CartoDB::InvalidMember, /Visualization type is not valid/)
    end

    it 'throws error if not valid type using carto model' do
      map = ::Map.create(user_id: @user.id)

      viz = Carto::Visualization.new(
        user_id: @user.id,
        name:    unique_name('viz'),
        map_id:  map.id,
        type:    'whatever',
        privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
      )

      viz.valid?.should be_false

      expect {
        viz.save!
      }.to raise_error(ActiveRecord::RecordInvalid, /Type is not included in the list/)
    end
  end

  describe '#estimated_row_count and #actual_row_count' do

    it 'should query Table estimated an actual row count methods' do
      ::Table.any_instance.stubs(:row_count_and_size).returns(row_count: 999)
      ::Table.any_instance.stubs(:actual_row_count).returns(1000)
      table = create_table(name: 'table1', user_id: @user.id)
      vis = Carto::Visualization.find(table.table_visualization.id)
      vis.estimated_row_count.should == 999
      vis.actual_row_count.should == 1000
    end

  end

  describe '#tags=' do
    it 'should not set blank tags' do
      vis = Carto::Visualization.new
      vis.tags = ["tag1", " ", ""]

      vis.tags.should eq ["tag1"]
    end
  end

  describe '#privacy=' do
    it 'downcases privacy' do
      visualization = Carto::Visualization.new
      visualization.privacy = Carto::Visualization::PRIVACY_LINK.upcase
      visualization.privacy.should eq Carto::Visualization::PRIVACY_LINK.downcase
    end
  end

  describe 'children' do
    it 'should correctly count children' do
      map = ::Map.create(user_id: @user.id)

      parent = CartoDB::Visualization::Member.new(
        user_id: @user.id,
        name:    unique_name('viz'),
        map_id:  map.id,
        type:    CartoDB::Visualization::Member::TYPE_DERIVED,
        privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
      ).store

      child = CartoDB::Visualization::Member.new(
        user_id:   @user.id,
        name:      unique_name('viz'),
        map_id:    ::Map.create(user_id: @user.id).id,
        type:      Visualization::Member::TYPE_SLIDE,
        privacy:   CartoDB::Visualization::Member::PRIVACY_PUBLIC,
        parent_id: parent.id
      ).store

      parent = Carto::Visualization.where(id: parent.id).first
      parent.children.count.should == 1

      child2 = CartoDB::Visualization::Member.new(
        user_id:   @user.id,
        name:      unique_name('viz'),
        map_id:    ::Map.create(user_id: @user.id).id,
        type:      Visualization::Member::TYPE_SLIDE,
        privacy:   CartoDB::Visualization::Member::PRIVACY_PUBLIC,
        parent_id: parent.id
      ).store
      child.set_next_list_item!(child2)

      parent = Carto::Visualization.where(id: parent.id).first

      parent.children.count.should == 2

    end
  end

  describe 'licenses' do
    it 'should store correctly a visualization with its license' do
      table = create_table(name: 'table1', user_id: @user.id)
      v = table.table_visualization
      v.license = Carto::License::APACHE_LICENSE
      v.store
      vis = Carto::Visualization.find(v.id)
      vis.license_info.id.should eq :apache
      vis.license_info.name.should eq "Apache license"
    end

  end

  describe '#related_tables_readable_by' do
    include Carto::Factories::Visualizations

    it 'only returns tables that a user can read' do
      @carto_user.update_attribute(:private_tables_enabled, true)
      map = FactoryGirl.create(:carto_map, user: @carto_user)

      private_table = FactoryGirl.create(:private_user_table, user: @carto_user)
      public_table = FactoryGirl.create(:public_user_table, user: @carto_user)

      private_layer = FactoryGirl.create(:carto_layer, options: { table_name: private_table.name }, maps: [map])
      FactoryGirl.create(:carto_layer, options: { table_name: public_table.name }, maps: [map])

      map, table, table_visualization, visualization = create_full_visualization(@carto_user,
                                                                                 map: map,
                                                                                 table: private_table,
                                                                                 data_layer: private_layer)

      related_table_ids_readable_by_owner = visualization.related_tables_readable_by(@carto_user).map(&:id)
      related_table_ids_readable_by_owner.should include(private_table.id)
      related_table_ids_readable_by_owner.should include(public_table.id)

      related_table_ids_readable_by_others = visualization.related_tables_readable_by(@carto_user2).map(&:id)
      related_table_ids_readable_by_others.should_not include(private_table.id)
      related_table_ids_readable_by_others.should include(public_table.id)

      destroy_full_visualization(map, table, table_visualization, visualization)
    end
  end

  describe '#published?' do
    before(:each) do
      @visualization = FactoryGirl.build(:carto_visualization, user: @carto_user)
    end

    it 'returns true for visualizations without version' do
      @visualization.version = nil
      @visualization.published?.should eq true
    end

    it 'returns true for v2 visualizations' do
      @visualization.version = 2
      @visualization.published?.should eq true
    end

    it 'returns false for v3 visualizations' do
      @visualization.version = 3
      @visualization.published?.should eq false
    end

    it 'returns true for mapcapped v3 visualizations' do
      @visualization.version = 3
      @visualization.stubs(:mapcapped?).returns(true)
      @visualization.published?.should eq true
    end
  end

  describe '#can_be_private?' do
    before(:all) do
      bypass_named_maps
      @visualization = FactoryGirl.create(:carto_visualization, user: @carto_user)
      @visualization.reload # to clean up the user relation (see #11134)
    end

    after(:all) do
      @visualization.destroy
    end

    it 'returns private_tables_enabled for tables' do
      @visualization.type = 'table'
      @visualization.can_be_private?.should eq @carto_user.private_tables_enabled
    end

    it 'returns private_maps_enabled for maps' do
      @visualization.type = 'derived'
      @visualization.can_be_private?.should eq @carto_user.private_maps_enabled
    end
  end

  describe '#save_named_map' do
    it 'should not save named map without layers' do
      @visualization = FactoryGirl.build(:carto_visualization, user: @carto_user)
      @visualization.expects(:named_maps_api).never
      @visualization.save
    end

    it 'should save named map with layers on map creation' do
      @visualization = FactoryGirl.build(:carto_visualization, user: @carto_user, map: FactoryGirl.build(:carto_map))
      @visualization.layers << FactoryGirl.build(:carto_layer)
      Carto::VisualizationInvalidationService.any_instance.expects(:invalidate).once
      @visualization.save
    end

    describe 'without mapcap' do
      before(:all) do
        @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user2)
      end

      after(:all) do
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      end

      it 'publishes layer style changes' do
        fake_style = 'this_is_a_very_fake_cartocss'
        layer = @visualization.data_layers.first
        layer.options[:tile_style] = fake_style

        named_maps_api_mock = mock
        named_maps_api_mock.expects(:upsert)

        Carto::NamedMaps::Api.expects(:new).with { |v| v.data_layers.first.options[:tile_style] == fake_style }
                             .returns(named_maps_api_mock).at_least_once
        layer.save
      end

      it 'publishes privacy changes' do
        @visualization.privacy = Carto::Visualization::PRIVACY_PUBLIC

        named_maps_api_mock = mock
        named_maps_api_mock.expects(:upsert)

        Carto::NamedMaps::Api.expects(:new).returns(named_maps_api_mock).at_least_once
        @visualization.save
      end
    end

    describe 'with mapcap' do
      before(:all) do
        @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user2)
        @visualization.create_mapcap!
        @visualization.reload
      end

      after(:all) do
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      end

      it 'does not publish layer style changes' do
        fake_style = 'this_is_a_very_fake_cartocss'
        layer = @visualization.data_layers.first
        layer.options[:tile_style] = fake_style

        named_maps_api_mock = mock
        named_maps_api_mock.stubs(upsert: true)

        Carto::NamedMaps::Api.stubs(:new).with { |v| v.data_layers.first.options[:tile_style] != fake_style }
                             .returns(named_maps_api_mock)
        Carto::NamedMaps::Api.expects(:new).with { |v| v.data_layers.first.options[:tile_style] == fake_style }
                             .never
        layer.save
      end

      it 'publishes layer style changes after mapcapping' do
        fake_style = 'changed_style_again'
        layer = @visualization.data_layers.first
        layer.options[:tile_style] = fake_style
        layer.save

        named_maps_api_mock = mock
        named_maps_api_mock.expects(:upsert).at_least_once

        Carto::NamedMaps::Api.expects(:new).with { |v| v.data_layers.first.options[:tile_style] == fake_style }
                             .returns(named_maps_api_mock).at_least_once
        @visualization.create_mapcap!
      end

      it 'publishes privacy changes' do
        @visualization.privacy = Carto::Visualization::PRIVACY_PUBLIC

        named_maps_api_mock = mock
        named_maps_api_mock.expects(:upsert)

        Carto::NamedMaps::Api.expects(:new).returns(named_maps_api_mock).at_least_once
        @visualization.save
      end
    end
  end

  describe 'creation' do
    it 'is not valid if user is viewer' do
      viewer = FactoryGirl.build(:carto_user, viewer: true)
      visualization = FactoryGirl.build(:carto_visualization, user: viewer)
      visualization.valid?.should be_false
      visualization.errors[:user].should_not be_empty
      visualization.errors[:user].first.should eq "cannot be viewer"
    end
  end

  describe '#destroy' do
    it 'destroys all visualization dependencies' do
      map = FactoryGirl.create(:carto_map_with_layers, user: @carto_user)
      visualization = FactoryGirl.create(:carto_visualization, user: @carto_user, map: map)
      FactoryGirl.create(:widget, layer: visualization.data_layers.first)
      FactoryGirl.create(:analysis, visualization: visualization, user: @carto_user)
      FactoryGirl.create(:carto_search_overlay, visualization: visualization)
      FactoryGirl.create(:carto_synchronization, visualization: visualization)
      visualization.create_mapcap!
      visualization.state.save

      Carto::VisualizationInvalidationService.any_instance.expects(:invalidate).once
      expect_visualization_to_be_destroyed(visualization) { visualization.destroy }
    end
  end

  describe '#backup' do
    before(:all) do
      @map = FactoryGirl.create(:carto_map_with_layers, user: @carto_user)
      Carto::VisualizationBackup.all.map(&:destroy)
    end

    after(:all) do
      @map.destroy
      Carto::VisualizationBackup.all.map(&:destroy)
    end

    it 'creates a backup when visualization is destroyed' do
      visualization = FactoryGirl.create(:carto_visualization, user: @carto_user, map: @map)
      visualization.destroy

      Carto::VisualizationBackup.all.count.should eq 1

      backup = Carto::VisualizationBackup.where(visualization_id: visualization.id).first
      backup.should_not eq nil
      backup.user_id.should eq @carto_user.id
      backup.created_at.should_not eq nil
      backup.category.should eq Carto::VisualizationBackup::CATEGORY_VISUALIZATION
      backup.export.should_not be_empty
      backup.destroy
    end
  end

  describe '#update' do
    before(:all) do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user2)
      @visualization.create_mapcap!
      @visualization.reload
    end

    after(:all) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    end

    it 'sanitizes name on rename' do
      original = @table_visualization.name
      @table_visualization.name = @table_visualization.name.upcase
      @table_visualization.save!

      @table_visualization.reload
      expect(@table_visualization.name).to eq(original)
    end
  end

  describe '#invalidation_service' do
    before(:all) do
      @visualization = FactoryGirl.create(:carto_visualization, user: @carto_user, type: 'table')
    end

    it 'triggers invalidation after saving' do
      @visualization.send(:invalidation_service).expects(:invalidate)
      @visualization.update_attributes(name: @visualization.name + '-renamed')
    end

    it 'triggers invalidation of affected maps after updating description field' do
      # Not a great test, it tests invalidation service internal implementation
      @visualization.send(:invalidation_service).expects(:invalidate_affected_visualizations)
      @visualization.update_attributes(description: 'something')
    end

    it 'triggers invalidation of affected maps after updating attributions field' do
      @visualization.send(:invalidation_service).expects(:invalidate_affected_visualizations)
      @visualization.update_attributes(attributions: 'something')
    end

    it 'triggers invalidation after destroying' do
      @visualization.send(:invalidation_service).expects(:invalidate)
      @visualization.destroy
    end
  end

  context 'like actions' do
    before(:each) do
      @visualization = FactoryGirl.create(:carto_visualization, user: @carto_user, type: 'table')
    end

    describe '#add_like_from' do
      include_context 'organization with users helper'
      it 'registers the like action from a user with permissions' do
        expect(@visualization.likes.count).to eq(0)

        @visualization.add_like_from(@carto_user)

        expect(@visualization.likes.count).to eq(1)
        expect(@visualization.liked_by?(@carto_user)).to be_true
      end

      it 'fail if a user try to favorite a visualization without permissions' do
        user_id = UUIDTools::UUID.timestamp_create.to_s
        user_mock = mock
        user_mock.stubs(:id).returns(user_id)
        expect(@visualization.likes.count).to eq(0)

        expect {
          @visualization.add_like_from(user_mock)
        }.to raise_error Carto::Visualization::UnauthorizedLikeError
      end

      it 'raises an error if same user tries to like again the same content' do
        user_id  = UUIDTools::UUID.timestamp_create.to_s
        user_mock = mock
        user_mock.stubs(:id).returns(user_id)

        @visualization.add_like_from(@carto_user)

        expect(@visualization.likes.count).to eq(1)
        expect(@visualization.liked_by?(@carto_user)).to be_true

        expect {
          @visualization.add_like_from(@carto_user)
        }.to raise_error Carto::Visualization::AlreadyLikedError
        expect(@visualization.likes.count).to eq(1)
      end

      it 'can add like to a shared visualization' do
        visualization = FactoryGirl.build(:carto_visualization,
                                          user: @carto_org_user_1,
                                          privacy: Carto::Visualization::PRIVACY_LINK.upcase)
        shared_entity = CartoDB::SharedEntity.new(
          recipient_id: @carto_org_user_2.id,
          recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
          entity_id: visualization.id,
          entity_type: CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
        )
        shared_entity.save
        visualization.permission.acl = [
          {
            type: Permission::TYPE_USER,
            entity: {
              id: @carto_org_user_2.id,
              username: @carto_org_user_2.username
            },
            access: Permission::ACCESS_READONLY
          }
        ]
        visualization.permission.save
        visualization.add_like_from(@carto_org_user_2)
        expect(visualization.likes.count).to eq(1)
      end
    end

    describe '#remove_like_from' do
      include_context 'organization with users helper'
      it 'removes an existent like from a user' do
        @visualization.add_like_from(@carto_user)
        expect(@visualization.likes.count).to eq(1)

        @visualization.remove_like_from(@carto_user)
        expect(@visualization.likes.count).to eq(0)
        expect(@visualization.liked_by?(@carto_user)).to be_false
      end

      it 'raises an error if you try to remove a favorite in a visualization you dont have permission' do
        user_id = UUIDTools::UUID.timestamp_create.to_s
        user_mock = mock
        user_mock.stubs(:id).returns(user_id)

        @visualization.add_like_from(@carto_user)
        expect(@visualization.likes.count).to eq(1)

        expect {
          @visualization.remove_like_from(user_mock)
        }.to raise_error Carto::Visualization::UnauthorizedLikeError
        expect(@visualization.likes.count).to eq(1)
      end

      it 'can remove like from a shared visualization' do
        visualization = FactoryGirl.build(:carto_visualization,
                                          user: @carto_org_user_1,
                                          privacy: Carto::Visualization::PRIVACY_LINK.upcase)
        shared_entity = CartoDB::SharedEntity.new(
          recipient_id: @carto_org_user_2.id,
          recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
          entity_id: visualization.id,
          entity_type: CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
        )
        shared_entity.save
        visualization.permission.acl = [
          {
            type: Permission::TYPE_USER,
            entity: {
              id: @carto_org_user_2.id,
              username: @carto_org_user_2.username
            },
            access: Permission::ACCESS_READONLY
          }
        ]
        visualization.permission.save
        visualization.add_like_from(@carto_org_user_2)
        expect(visualization.likes.count).to eq(1)
        visualization.remove_like_from(@carto_org_user_2)
        expect(visualization.likes.count).to eq(0)
      end
    end

    describe '#liked_by?' do
      it 'returns true when the user liked the visualization' do
        @visualization.add_like_from(@carto_user)
        expect(@visualization.liked_by?(@carto_user)).to be_true
      end

      it 'returns false when checking a user without likes on the visualization' do
        user_id = UUIDTools::UUID.timestamp_create.to_s
        user_mock = mock
        user_mock.stubs(:id).returns(user_id)

        @visualization.add_like_from(@carto_user)
        expect(@visualization.liked_by?(user_mock)).to be_false
      end
    end
  end

  context 'quota check' do
    before(:each) do
      @carto_user.private_maps_enabled = true
      @carto_user.save
      @visualization = FactoryGirl.create(:carto_visualization, user: @carto_user,
                                                                privacy: Carto::Visualization::PRIVACY_PRIVATE)
    end

    after(:all) do
      @carto_user.public_map_quota = nil
      @carto_user.save
    end

    it 'does not allow to make a map public when the limit is reached' do
      @carto_user.public_map_quota = 0
      @carto_user.save

      @visualization.privacy = Carto::Visualization::PRIVACY_PUBLIC
      @visualization.save

      @visualization.reload.privacy.should eql Carto::Visualization::PRIVACY_PRIVATE
      @visualization.errors.count.should eql 1
    end

    it 'allows to make the map public if the limit is not reached' do
      @carto_user.public_map_quota = 1
      @carto_user.save

      @visualization.privacy = Carto::Visualization::PRIVACY_PUBLIC
      @visualization.save

      @visualization.reload.privacy.should eql Carto::Visualization::PRIVACY_PUBLIC
    end
  end
end
