require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/presenter'
require_relative '../../doubles/support_tables.rb'

include CartoDB

describe Visualization::Member do
  before do
    @db = SequelRails.connection
    Sequel.extension(:pagination)

    Visualization.repository  = DataRepository::Backend::Sequel.new(@db, :visualizations)
  end

  before(:each) do
    bypass_named_maps

    user_name = 'whatever'
    @user_mock = FactoryGirl.build(:user, username: user_name)
    allow_any_instance_of(CartoDB::Visualization::Relator).to receive(:user).and_return(@user_mock)

    support_tables_mock = Doubles::Visualization::SupportTables.new
    allow_any_instance_of(Visualization::Relator).to receive(:support_tables).and_return(support_tables_mock)
  end

  describe '#privacy_for_vizjson' do
    it 'checks expected privacy values for the vizjson' do
      visualization = Visualization::Member.new(
          privacy: Visualization::Member::PRIVACY_PUBLIC,
          name: 'test',
          type: Visualization::Member::TYPE_CANONICAL
      )

      # Careful, do a user mock after touching user_data as it does some checks about user too
      user_mock = double
      allow(user_mock).to receive(:private_tables_enabled).and_return(true)
      allow(user_mock).to receive(:id).and_return(@user_mock.id)
      allow_any_instance_of(Visualization::Member).to receive(:user).and_return(user_mock)

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
      perm_mock = FactoryGirl.build(:carto_permission)

      vis_mock = double
      allow(vis_mock).to receive(:id).and_return(Carto::UUIDHelper.random_uuid)
      allow(vis_mock).to receive(:name).and_return('vis1')
      allow(vis_mock).to receive(:display_name).and_return('vis1')
      allow(vis_mock).to receive(:map_id).and_return(Carto::UUIDHelper.random_uuid)
      allow(vis_mock).to receive(:active_layer_id).and_return(1)
      allow(vis_mock).to receive(:type).and_return(Visualization::Member::TYPE_CANONICAL)
      allow(vis_mock).to receive(:tags).and_return(['tag1'])
      allow(vis_mock).to receive(:description).and_return('desc')
      allow(vis_mock).to receive(:privacy).and_return(Visualization::Member::PRIVACY_PUBLIC)
      allow(vis_mock).to receive(:stats).and_return('123')
      allow(vis_mock).to receive(:created_at).and_return(Time.now)
      allow(vis_mock).to receive(:updated_at).and_return(Time.now)
      allow(vis_mock).to receive(:permission).and_return(perm_mock)
      allow(vis_mock).to receive(:locked).and_return(true)
      allow(vis_mock).to receive(:source).and_return('')
      allow(vis_mock).to receive(:license).and_return('')
      allow(vis_mock).to receive(:attributions).and_return('')
      allow(vis_mock).to receive(:title).and_return('')
      allow(vis_mock).to receive(:parent_id).and_return(nil)
      allow(vis_mock).to receive(:children).and_return([])
      allow(vis_mock).to receive(:kind).and_return(Visualization::Member::KIND_GEOM)
      allow(vis_mock).to receive(:table).and_return(nil)
      allow(vis_mock).to receive(:related_tables).and_return([])
      allow(vis_mock).to receive(:prev_id).and_return(nil)
      allow(vis_mock).to receive(:next_id).and_return(nil)
      allow(vis_mock).to receive(:transition_options).and_return({})
      allow(vis_mock).to receive(:active_child).and_return(nil)
      allow(vis_mock).to receive(:likes).and_return([])

      allow(vis_mock).to receive(:synchronization).and_return(nil)
      allow(vis_mock).to receive(:subscription).and_return(nil)

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
      data[:prev_id].should eq nil
      data[:next_id].should eq nil
      data[:transition_options].should eq Hash.new
      data[:active_child].should eq nil
    end
  end

  describe '#children' do
    it 'tests .children and its sorting' do
      allow_any_instance_of(Visualization::Member).to receive(:supports_private_maps?).and_return(true)

      allow_any_instance_of(Carto::Permission).to receive(:owner).and_return(@user_mock)

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

      @request_mock = double
      allow(@request_mock).to receive(:host).and_return("#{@user_mock.username}#{CartoDB.session_domain}")
      allow(@request_mock).to receive(:fullpath).and_return('')

      data = Visualization::Presenter.new(parent,{request:@request_mock}).to_poro

      data[:children].length.should eq 5

      data[:children][0][:id].should eq member_a.id
      data[:children][1][:id].should eq member_b.id
      data[:children][2][:id].should eq member_c.id
      data[:children][3][:id].should eq member_d.id
      data[:children][4][:id].should eq member_e.id
    end
  end

end
