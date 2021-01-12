require 'spec_helper'

describe OrganizationCommands::Create do
  let(:notifications_topic) { mock }
  let(:params) { { organization: organization_params } }
  let(:command) { described_class.new(params) }

  describe '#run' do
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

      before do
        notifications_topic.expects(:publish)
        BaseCommand.any_instance.expects(:notifications_topic).returns(notifications_topic)
      end

      it 'creates the organization' do
        command.run

        expect(Carto::Organization.exists?(name: 'carto')).to be_true
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
