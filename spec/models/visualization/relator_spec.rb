# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/relator'
require_relative '../../../app/models/visualization/member'
require_relative '../../../app/models/visualization/collection'
require_relative '../../doubles/support_tables.rb'

include CartoDB

describe Visualization::Relator do
  before do
    @db = Rails::Sequel.connection
    Sequel.extension(:pagination)

    Visualization.repository  = DataRepository::Backend::Sequel.new(@db, :visualizations)
  end

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
      vis = table.table_visualization
      vis.estimated_row_count.should == 999
      vis.actual_row_count.should == 1000
    end

  end

  before(:each) do
    # For relator->permission
    @user_mock = create_mocked_user
    CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(@user_mock)

    support_tables_mock = Doubles::Visualization::SupportTables.new
    Visualization::Relator.any_instance.stubs(:support_tables).returns(support_tables_mock)
  end

  describe '#related_canonical_visualizations' do

    it 'should return the canonical visualizations associated to a derived visualization' do
      table1 = create_table({:name => 'table1', :user_id => @user.id})
      table2 = create_table({:name => 'table2', :user_id => @user.id})
      vis_table1 = create_vis_from_table(@user, table1)
      vis_table2 = create_vis_from_table(@user, table2)

      vis_table1.related_canonical_visualizations.map(&:id).should == [table1.table_visualization.id]
    end
  end

  describe '#children' do
    it 'tests .children and its sorting' do
      Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

      parent = Visualization::Member.new(random_attributes_for_vis_member({
                                                            name:'PARENT',
                                                            user_id: @user_mock.id,
                                                            type: Visualization::Member::TYPE_DERIVED }))
      parent = parent.store.fetch

      # Create unsorted on purpose
      member_d = Visualization::Member.new(random_attributes_for_vis_member({
                                                              name:'D', type: Visualization::Member::TYPE_SLIDE,
                                                              user_id: @user_mock.id,
                                                              parent_id: parent.id }))
      member_d = member_d.store.fetch
      member_c = Visualization::Member.new(random_attributes_for_vis_member({
                                                              name:'C', type: Visualization::Member::TYPE_SLIDE,
                                                              user_id: @user_mock.id,
                                                              parent_id: parent.id }))
      member_c = member_c.store.fetch
      member_b = Visualization::Member.new(random_attributes_for_vis_member({
                                                              name:'B', type: Visualization::Member::TYPE_SLIDE,
                                                              user_id: @user_mock.id,
                                                              parent_id: parent.id }))
      member_b = member_b.store.fetch
      member_e = Visualization::Member.new(random_attributes_for_vis_member({
                                                              name:'E', type: Visualization::Member::TYPE_SLIDE,
                                                              user_id: @user_mock.id,
                                                              parent_id: parent.id }))
      member_e = member_e.store.fetch
      member_a = Visualization::Member.new(random_attributes_for_vis_member({
                                                              name:'A', type: Visualization::Member::TYPE_SLIDE,
                                                              user_id: @user_mock.id,
                                                              parent_id: parent.id }))
      member_a = member_a.store.fetch

      # A -> B -> C -> D -> E
      member_a.set_next_list_item! member_b
      member_b.set_next_list_item! member_c
      member_c.set_next_list_item! member_d
      member_d.set_next_list_item! member_e
      member_a.fetch
      member_b.fetch
      member_c.fetch
      member_d.fetch
      member_e.fetch

      parent.fetch

      children = parent.children

      children.length.should eq 5

      children[0].id.should eq member_a.id
      children[1].id.should eq member_b.id
      children[2].id.should eq member_c.id
      children[3].id.should eq member_d.id
      children[4].id.should eq member_e.id
    end
  end


  private

  def create_vis_from_table(user, table)
    blender = Visualization::TableBlender.new(user, [table])
    map = blender.blend
    vis = Visualization::Member.new(
        name:     'wadus_vis',
        map_id:   map.id,
        type:     Visualization::Member::TYPE_DERIVED,
        privacy:  blender.blended_privacy,
        user_id:  user.id
    )
    vis.store
    vis
  end

end
