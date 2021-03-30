require 'spec_helper_unit'

describe OrganizationCommands::Create do
  let(:notifications_topic) { mock }
  let(:params) { { organization: organization_params } }
  let(:command) { described_class.new(params) }

  describe '#run' do
    context 'when everything is ok' do
      let(:user) { create(:valid_user) }
      let(:organization_name) { Faker::Internet.username(separators: ['-']) }
      let(:organization_params) do
        {
          name: organization_name,
          owner_id: user.id,
          seats: 1,
          quota_in_bytes: 1.gigabyte
        }
      end
      let(:created_organization) { Carto::Organization.find_by(name: organization_name) }

      before do
        notifications_topic.expects(:publish)
        CartoCommand.any_instance.expects(:notifications_topic).returns(notifications_topic)
      end

      it 'creates the organization' do
        command.run

        expect(created_organization).to be_present
      end

      it 'creates an organization without owner' do
        organization_params[:owner_id] = nil

        command.run

        expect(created_organization).to be_present
        expect(created_organization.owner).to be_nil
      end
    end

    context 'when error occurs' do
      let(:organization_params) { { name: 'carto' } }

      it 'raises an exception and does not create the organization' do
        expect { command.run }.to raise_error(ActiveRecord::RecordInvalid)
        expect(Carto::Organization.exists?(name: 'CARTO')).to be_false
      end
    end
  end
end
