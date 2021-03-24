require 'spec_helper_unit'

describe OrganizationCommands::Update do
  let(:organization) { create(:organization_with_users, seats: 10) }
  let(:command) { described_class.new(params) }

  describe '#run' do
    let(:params) { { id: organization.id, organization: organization_params } }

    context 'when everything is ok' do
      let(:organization_params) do
        {
          seats: 100,
          display_name: 'New Display Name',
          map_views_quota: 100_000
        }
      end

      it 'updates changed attributes' do
        command.run

        organization.reload
        expect(organization.seats).to eq(100)
        expect(organization.display_name).to eq('New Display Name')
        expect(organization.map_views_quota).to eq(100_000)
      end
    end

    context 'when error occurs' do
      let(:organization_params) { { here_isolines_quota: 1.2 } }

      it 'raises an error and does not update attributes' do
        expect { command.run }.to raise_error(ActiveRecord::RecordInvalid)
        expect(organization.reload.quota_in_bytes).not_to eq(1.2)
      end
    end
  end
end
