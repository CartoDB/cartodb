require 'spec_helper'

describe OrganizationCommands::Delete do
  let(:notifications_topic) { mock }
  let(:organization) { create_organization_with_users(seats: 10) }
  let(:command) { described_class.new(id: organization.id) }

  describe '#run' do
    context 'when everything is ok' do
      before do
        notifications_topic.expects(:publish)
        BaseCommand.any_instance.expects(:notifications_topic).returns(notifications_topic)
        command.run
      end

      it 'deletes the organization' do
        expect { organization.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context 'when error occurs' do
      before { ::User.any_instance.stubs(:destroy_cascade).raises(StandardError.new) }

      it 'raises an error' do
        expect { command.run }.to raise_error(StandardError)
      end
    end
  end
end
