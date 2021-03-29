require 'spec_helper'

describe OrganizationPresenter do
  let(:organization_owner) do
    create(
      :carto_user,
      period_end_date: Time.parse('2018-01-01'),
      factory_bot_context: { only_db_setup: true }
    )
  end
  let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
  let(:user) { organization.owner }
  let(:presenter) { described_class.new(organization) }
  let(:date_range) { { Date.new(2017, 3, 20) => 1 } }

  describe '#data' do
    before do
      CartoDB::ServiceUsageMetrics.any_instance.stubs(:get_date_range).returns(date_range)
    end

    it 'returns the default representation' do
      expect(presenter.data[:id]).to eq(organization.id)
      expect(presenter.data[:owner][:username]).to eq(organization.owner.username)
    end

    it 'returns extra attributes for the extended representation' do
      presenter = described_class.new(organization, extended: true)

      expect(presenter.data[:table_count]).to eq(0)
    end
  end
end
