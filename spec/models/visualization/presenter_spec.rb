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
end # Visualization

