# coding: UTF-8
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/member'
require 'helpers/random_names_helper'

describe Carto::Visualization do
  include RandomNamesHelper

  before(:all) do
    @user = create_user({
        email: 'admin@cartotest.com',
        username: 'admin',
        password: '123456'
      })
  end

  before(:each) do
    stub_named_maps_calls
    delete_user_data(@user)
  end

  after(:all) do
    stub_named_maps_calls
    @user.destroy
  end

  describe '#estimated_row_count and #actual_row_count' do

    it 'should query Table estimated an actual row count methods' do
      ::Table.any_instance.stubs(:estimated_row_count).returns(999)
      ::Table.any_instance.stubs(:actual_row_count).returns(1000)
      table = create_table({:name => 'table1', :user_id => @user.id})
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

      parent = CartoDB::Visualization::Member.new({
          user_id: @user.id,
          name:    random_name('viz'),
          map_id:  map.id,
          type:    CartoDB::Visualization::Member::TYPE_DERIVED,
          privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
        }).store

      child = CartoDB::Visualization::Member.new({
          user_id:   @user.id,
          name:      random_name('viz'),
          map_id:    ::Map.create(user_id: @user.id).id,
          type:      Visualization::Member::TYPE_SLIDE,
          privacy:   CartoDB::Visualization::Member::PRIVACY_PUBLIC,
          parent_id: parent.id
        }).store

      parent = Carto::Visualization.where(id: parent.id).first
      parent.children.count.should == 1

      child2 = CartoDB::Visualization::Member.new({
          user_id:   @user.id,
          name:      random_name('viz'),
          map_id:    ::Map.create(user_id: @user.id).id,
          type:      Visualization::Member::TYPE_SLIDE,
          privacy:   CartoDB::Visualization::Member::PRIVACY_PUBLIC,
          parent_id: parent.id
        }).store
      child.set_next_list_item!(child2)

      child = Carto::Visualization.where(id: child.id).first
      child2 = Carto::Visualization.where(id: child2.id).first
      parent = Carto::Visualization.where(id: parent.id).first

      parent.children.count.should == 2

    end
  end

  describe 'licenses' do
    it 'should store correctly a visualization with its license' do
      table = create_table({:name => 'table1', :user_id => @user.id})
      v = table.table_visualization
      v.license = Carto::License::APACHE_LICENSE
      v.store
      vis = Carto::Visualization.find(v.id)
      vis.license_info.id.should eq :apache
      vis.license_info.name.should eq "Apache license"
    end

  end

end
