# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/presenter'
require_relative '../../doubles/support_tables.rb'

include CartoDB

describe Visualization::Member do
  before do
    @db = Rails::Sequel.connection
    Sequel.extension(:pagination)

    Visualization.repository  = DataRepository::Backend::Sequel.new(@db, :visualizations)
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

    user_id = UUIDTools::UUID.timestamp_create.to_s
    user_name = 'whatever'
    user_apikey = '123'
    @user_mock = mock
    @user_mock.stubs(:id).returns(user_id)
    @user_mock.stubs(:username).returns(user_name)
    @user_mock.stubs(:api_key).returns(user_apikey)
    @user_mock.stubs(:avatar_url).returns('')
    @user_mock.stubs(:public_url).returns("http://#{user_name}.cartodb.com")
    @user_mock.stubs(:groups).returns([])
    CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(@user_mock)

    support_tables_mock = Doubles::Visualization::SupportTables.new
    Visualization::Relator.any_instance.stubs(:support_tables).returns(support_tables_mock)
  end

  describe '#privacy_for_vizjson' do
    it 'checks expected privacy values for the vizjson' do
      visualization = Visualization::Member.new(
          privacy: Visualization::Member::PRIVACY_PUBLIC,
          name: 'test',
          type: Visualization::Member::TYPE_CANONICAL
      )
      visualization.user_data = { actions: { private_maps: true } }
      # Careful, do a user mock after touching user_data as it does some checks about user too
      user_mock = mock
      user_mock.stubs(:private_tables_enabled).returns(true)
      user_mock.stubs(:id).returns(@user_mock.id)
      Visualization::Member.any_instance.stubs(:user).returns(user_mock)

      presenter = Visualization::Presenter.new(visualization)
      presenter.send(:privacy_for_vizjson).should eq Visualization::Member::PRIVACY_PUBLIC

      visualization.privacy = Visualization::Member::PRIVACY_PRIVATE
      presenter.send(:privacy_for_vizjson).should eq Visualization::Member::PRIVACY_PRIVATE

      visualization.privacy = Visualization::Member::PRIVACY_PROTECTED
      presenter.send(:privacy_for_vizjson).should eq Visualization::Member::PRIVACY_PROTECTED

      visualization.privacy = Visualization::Member::PRIVACY_LINK
      presenter.send(:privacy_for_vizjson).should eq Visualization::Member::PRIVACY_PUBLIC
    end
  end

  describe 'to_poro fields' do
    it 'basic fields expected at the to_poro method' do
      perm_mock = mock
      perm_mock.stubs(:to_poro).returns({ wadus: 'wadus'})

      vis_mock = mock
      vis_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      vis_mock.stubs(:name).returns('vis1')
      vis_mock.stubs(:display_name).returns('vis1')
      vis_mock.stubs(:map_id).returns(UUIDTools::UUID.timestamp_create.to_s)
      vis_mock.stubs(:active_layer_id).returns(1)
      vis_mock.stubs(:type).returns(Visualization::Member::TYPE_CANONICAL)
      vis_mock.stubs(:tags).returns(['tag1'])
      vis_mock.stubs(:description).returns('desc')
      vis_mock.stubs(:privacy).returns(Visualization::Member::PRIVACY_PUBLIC)
      vis_mock.stubs(:stats).returns('123')
      vis_mock.stubs(:created_at).returns(Time.now)
      vis_mock.stubs(:updated_at).returns(Time.now)
      vis_mock.stubs(:permission).returns(perm_mock)
      vis_mock.stubs(:locked).returns(true)
      vis_mock.stubs(:source).returns('')
      vis_mock.stubs(:license).returns('')
      vis_mock.stubs(:attributions).returns('')
      vis_mock.stubs(:title).returns('')
      vis_mock.stubs(:parent_id).returns(nil)
      vis_mock.stubs(:children).returns([])
      vis_mock.stubs(:kind).returns(Visualization::Member::KIND_GEOM)
      vis_mock.stubs(:table).returns(nil)
      vis_mock.stubs(:related_tables).returns([])
      vis_mock.stubs(:prev_id).returns(nil)
      vis_mock.stubs(:next_id).returns(nil)
      vis_mock.stubs(:transition_options).returns({})
      vis_mock.stubs(:active_child).returns(nil)
      vis_mock.stubs(:likes).returns([])
      vis_mock.stubs(:likes_count).returns(0)

      vis_mock.stubs(:synchronization).returns(nil)

      presenter = Visualization::Presenter.new(vis_mock)
      data = presenter.to_poro

      data[:id].present?.should eq true
      data[:name].present?.should eq true
      data[:display_name].present?.should eq true
      data[:map_id].present?.should eq true
      data[:active_layer_id].present?.should eq true
      data[:type].present?.should eq true
      data[:tags].present?.should eq true
      data[:description].present?.should eq true
      data[:privacy].present?.should eq true
      data[:stats].present?.should eq true
      data[:created_at].present?.should eq true
      data[:updated_at].present?.should eq true
      data[:permission].present?.should eq true
      data[:locked].present?.should eq true
      data[:related_tables].should eq Array.new
      data[:table].should eq Hash.new
      data[:parent_id].should eq nil
      data[:children].should eq Array.new
      data[:kind].should eq Visualization::Member::KIND_GEOM
      data[:likes].should eq 0
      data[:prev_id].should eq nil
      data[:next_id].should eq nil
      data[:transition_options].should eq Hash.new
      data[:active_child].should eq nil
    end
  end

  describe '#children' do
    it 'tests .children and its sorting' do
      Visualization::Member.any_instance.stubs(:supports_private_maps?).returns(true)

      ::Permission.any_instance.stubs(:owner).returns(@user_mock)

      parent = Visualization::Member.new(random_attributes_for_vis_member({
                                                                            name:'PARENT',
                                                                            user_id: @user_mock.id,
                                                                            type: Visualization::Member::TYPE_DERIVED
                                                                          }))
      parent = parent.store.fetch

      # Create unsorted on purpose
      member_d = Visualization::Member.new(random_attributes_for_vis_member({
                                                                              name:'D',
                                                                              user_id: @user_mock.id,
                                                                              type: Visualization::Member::TYPE_SLIDE,
                                                                              parent_id: parent.id
                                                                            }))
      member_d = member_d.store.fetch
      member_c = Visualization::Member.new(random_attributes_for_vis_member({
                                                                              name:'C',
                                                                              user_id: @user_mock.id,
                                                                              type: Visualization::Member::TYPE_SLIDE,
                                                                              parent_id: parent.id
                                                                            }))
      member_c = member_c.store.fetch
      member_b = Visualization::Member.new(random_attributes_for_vis_member({
                                                                              name:'B',
                                                                              user_id: @user_mock.id,
                                                                              type: Visualization::Member::TYPE_SLIDE,
                                                                              parent_id: parent.id
                                                                            }))
      member_b = member_b.store.fetch
      member_e = Visualization::Member.new(random_attributes_for_vis_member({
                                                                              name:'E',
                                                                              user_id: @user_mock.id,
                                                                              type: Visualization::Member::TYPE_SLIDE,
                                                                              parent_id: parent.id
                                                                            }))
      member_e = member_e.store.fetch
      member_a = Visualization::Member.new(random_attributes_for_vis_member({
                                                                              name:'A',
                                                                              user_id: @user_mock.id,
                                                                              type: Visualization::Member::TYPE_SLIDE,
                                                                              parent_id: parent.id
                                                                            }))
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

      @request_mock = mock
      @request_mock.stubs(:host).returns("#{@user_mock.username}#{CartoDB.session_domain}")
      @request_mock.stubs(:fullpath).returns('')

      data = Visualization::Presenter.new(parent,{request:@request_mock}).to_poro

      data[:children].length.should eq 5

      data[:children][0][:id].should eq member_a.id
      data[:children][1][:id].should eq member_b.id
      data[:children][2][:id].should eq member_c.id
      data[:children][3][:id].should eq member_d.id
      data[:children][4][:id].should eq member_e.id
      data[:likes].should eq 0
    end
  end

end
