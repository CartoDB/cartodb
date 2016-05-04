# coding: UTF-8
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/member'
require 'helpers/unique_names_helper'

describe Carto::Visualization do
  include UniqueNamesHelper

  before(:all) do
    @user = create_user(
      email: 'admin@cartotest.com',
      username: 'admin',
      password: '123456'
    )
    @carto_user = Carto::User.find(@user.id)
    @user2 = create_user(
      email: 'noadmin@cartotest.com',
      username: 'noadmin',
      password: '123456'
    )
    @carto_user2 = Carto::User.find(@user2.id)
  end

  before(:each) do
    stub_named_maps_calls
    delete_user_data(@user)
  end

  after(:all) do
    stub_named_maps_calls
    @user.destroy
    @user2.destroy
  end

  describe '#estimated_row_count and #actual_row_count' do

    it 'should query Table estimated an actual row count methods' do
      ::Table.any_instance.stubs(:estimated_row_count).returns(999)
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
      private_table = FactoryGirl.create(:private_user_table, user: @carto_user)
      public_table = FactoryGirl.create(:public_user_table, user: @carto_user)

      private_layer = FactoryGirl.create(:carto_layer, options: { table_name: private_table.name })
      public_layer =  FactoryGirl.create(:carto_layer, options: { table_name: public_table.name })

      map = FactoryGirl.create(:carto_map, layers: [private_layer, public_layer], user: @carto_user)
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
end
