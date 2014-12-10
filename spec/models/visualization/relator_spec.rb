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

    support_tables_mock = Doubles::Visualization::SupportTables.new
    Visualization::Relator.any_instance.stubs(:support_tables).returns(support_tables_mock)
  end

  describe '#children' do
    it 'tests .children and its sorting' do
      Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

      parent = Visualization::Member.new(random_attributes({ name:'PARENT',
                                                             type: Visualization::Member::TYPE_CANONICAL }))
      parent = parent.store.fetch

      # Create unsorted on purpose
      member_d = Visualization::Member.new(random_attributes({ name:'D', type: Visualization::Member::TYPE_SLIDE,
                                                               parent_id: parent.id }))
      member_d = member_d.store.fetch
      member_c = Visualization::Member.new(random_attributes({ name:'C', type: Visualization::Member::TYPE_SLIDE,
                                                               parent_id: parent.id }))
      member_c = member_c.store.fetch
      member_b = Visualization::Member.new(random_attributes({ name:'B', type: Visualization::Member::TYPE_SLIDE,
                                                               parent_id: parent.id }))
      member_b = member_b.store.fetch
      member_e = Visualization::Member.new(random_attributes({ name:'E', type: Visualization::Member::TYPE_SLIDE,
                                                               parent_id: parent.id }))
      member_e = member_e.store.fetch
      member_a = Visualization::Member.new(random_attributes({ name:'A', type: Visualization::Member::TYPE_SLIDE,
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

      children[0][:id].should eq member_a.id
      children[1][:id].should eq member_b.id
      children[2][:id].should eq member_c.id
      children[3][:id].should eq member_d.id
      children[4][:id].should eq member_e.id
    end
  end

  # TODO: Move this to a factory
  protected

  def random_attributes(attributes={})
    random = UUIDTools::UUID.timestamp_create.to_s
    {
      name:         attributes.fetch(:name, "name #{random}"),
      description:  attributes.fetch(:description, "description #{random}"),
      privacy:      attributes.fetch(:privacy, Visualization::Member::PRIVACY_PUBLIC),
      tags:         attributes.fetch(:tags, ['tag 1']),
      type:         attributes.fetch(:type, Visualization::Member::TYPE_CANONICAL),
      user_id:      attributes.fetch(:user_id, @user_mock.id),
      active_layer_id: random,
      title:        attributes.fetch(:title, ''),
      source:       attributes.fetch(:source, ''),
      license:      attributes.fetch(:license, ''),
      parent_id:    attributes.fetch(:parent_id, nil),
      kind:         attributes.fetch(:kind, Visualization::Member::KIND_GEOM),
      prev_id:            attributes.fetch(:prev_id, nil),
      next_id:            attributes.fetch(:next_id, nil),
      transition_options: attributes.fetch(:transition_options, {})
    }
  end

end


