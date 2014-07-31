# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/presenter'

include CartoDB

describe Visualization::Member do
  before do
    memory = DataRepository.new
    Visualization.repository  = memory
    Overlay.repository        = memory
  end

  before(:each) do
  end

  describe '#privacy_for_vizjson' do
    it 'checks expected privacy values for the vizjson' do
      user_id = UUIDTools::UUID.timestamp_create.to_s

      visualization = Visualization::Member.new(
          privacy: Visualization::Member::PRIVACY_PUBLIC,
          name: 'test',
          type: Visualization::Member::CANONICAL_TYPE
      )
      visualization.user_data = { actions: { private_maps: true } }
      # Careful, do a user mock after touching user_data as it does some checks about user too
      user_mock = mock
      user_mock.stubs(:private_tables_enabled).returns(true)
      user_mock.stubs(:id).returns(user_id)
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
    it 'basic fields as of jul-2014' do
      user_id = UUIDTools::UUID.timestamp_create.to_s

      perm_mock = mock
      perm_mock.stubs(:to_poro).returns({ wadus: 'wadus'})

      vis_mock = mock
      vis_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      vis_mock.stubs(:name).returns('vis1')
      vis_mock.stubs(:map_id).returns(UUIDTools::UUID.timestamp_create.to_s)
      vis_mock.stubs(:active_layer_id).returns(1)
      vis_mock.stubs(:type).returns(Visualization::Member::CANONICAL_TYPE)
      vis_mock.stubs(:tags).returns(['tag1'])
      vis_mock.stubs(:description).returns('desc')
      vis_mock.stubs(:privacy).returns(Visualization::Member::PRIVACY_PUBLIC)
      vis_mock.stubs(:stats).returns('123')
      vis_mock.stubs(:created_at).returns(Time.now)
      vis_mock.stubs(:updated_at).returns(Time.now)
      vis_mock.stubs(:permission).returns(perm_mock)
      vis_mock.stubs(:locked).returns(true)

      vis_mock.stubs(:table).returns(nil)
      vis_mock.stubs(:related_tables).returns([])

      presenter = Visualization::Presenter.new(vis_mock)
      data = presenter.to_poro

      data[:id].present?.should eq true
      data[:name].present?.should eq true
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
    end
  end

end

