require 'spec_helper'

describe Carto::Subscribers::CentralOrganizationCommands do
  include CartoDB::Factories

  let(:notifications_topic) { mock }
  let(:central_organization_commands) { described_class.new(notifications_topic: notifications_topic) }
  let(:organization) { create_organization_with_users(seats: 10) }

  describe '#update_organization' do
    let(:payload) { { id: organization.id, organization: organization_params } }

    context 'when everything is ok' do
      let(:organization_params) { { seats: 100 } }

      before { central_organization_commands.update_organization(payload) }

      it 'updates changed attributes' do
        expect(organization.reload.seats).to eq(100)
      end
    end

    context 'when error occurs' do
      let(:organization_params) { { name: 'New name' } }

      before { central_organization_commands.update_organization(payload) }

      it 'fails silently and does not update attributes' do
        expect(organization.reload.seats).to eq(10)
      end
    end
  end

  describe '#create_organization' do
    before { central_organization_commands.create_organization(payload) }

    let(:payload) { { organization: organization_params } }

    context 'when everything is ok' do
      let(:user) { create(:valid_user) }
      let(:organization_params) do
        {
          name: 'carto',
          owner_id: user.id,
          seats: 1,
          quota_in_bytes: 1.gigabyte
        }
      end

      it 'creates the organization' do
        expect(Carto::Organization.exists?(name: 'carto')).to be_true
      end
    end

    context 'when error occurs' do
      let(:organization_params) { { name: 'carto' } }

      it 'fails silently and does not create the organization' do
        expect(Carto::Organization.exists?(name: 'CARTO')).to be_false
      end
    end
  end

  describe '#delete_organization' do
    let(:payload) { { id: organization.id } }

    context 'when everything is ok' do
      before { central_organization_commands.delete_organization(payload) }

      it 'deletes the organization' do
        expect { organization.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context 'when error occurs' do
      before { ::User.any_instance.stubs(:destroy_cascade).raises(StandardError.new) }

      it 'raises an error' do
        expect { central_organization_commands.delete_organization(payload) }.to raise_error(StandardError)
      end
    end
  end
end
