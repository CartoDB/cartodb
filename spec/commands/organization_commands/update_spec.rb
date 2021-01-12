require 'spec_helper'

describe OrganizationCommands::Update do
  let(:organization) { create_organization_with_users(seats: 10) }
  let(:command) { described_class.new(params) }

  describe '#run' do
    let(:params) { { id: organization.id, organization: organization_params } }

    context 'when everything is ok' do
      let(:organization_params) { { seats: 100 } }

      it 'updates changed attributes' do
        command.run
        expect(organization.reload.seats).to eq(100)
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
