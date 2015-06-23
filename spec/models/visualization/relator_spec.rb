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
    Overlay.repository        = DataRepository.new # In-memory storage
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

    # For relator->permission
    user_id = UUIDTools::UUID.timestamp_create.to_s
    user_name = 'whatever'
    user_apikey = '123'
    @user_mock = mock
    @user_mock.stubs(:id).returns(user_id)
    @user_mock.stubs(:username).returns(user_name)
    @user_mock.stubs(:api_key).returns(user_apikey)
    CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(@user_mock)

    support_tables_mock = Doubles::Visualization::SupportTables.new
    Visualization::Relator.any_instance.stubs(:support_tables).returns(support_tables_mock)
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

end


