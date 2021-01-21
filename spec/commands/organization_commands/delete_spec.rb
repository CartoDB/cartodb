require 'spec_helper'

describe OrganizationCommands::Delete do
  let(:notifications_topic) { mock }
  let(:organization) { create_organization_with_users(seats: 10) }
  let(:organization_id) { organization.id }
  let(:command) { described_class.new(id: organization_id) }

  describe '#run' do
    context 'when everything is ok' do
      before do
        CartoCommand.any_instance.expects(:notifications_topic).returns(notifications_topic)
      end

      it 'deletes the organization and publishes an organization_deleted event' do
        notifications_topic.expects(:publish).with(:organization_deleted, id: organization_id)

        command.run

        expect { organization.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context 'when the organization does not exist' do
      before do
        CartoCommand.any_instance.expects(:notifications_topic).returns(notifications_topic)
      end

      let(:organiation_id) { 'fake-id' }

      it 'finishes successfully and publishes an organization_deleted event' do
        notifications_topic.expects(:publish).with(:organization_deleted, id: organization_id)

        command.run
      end
    end

    context 'when error occurs' do
      before { ::User.any_instance.stubs(:destroy_cascade).raises(StandardError.new) }

      it 'raises an error and does not publish an organization_deleted event' do
        notifications_topic.expects(:publish).never

        expect { command.run }.to raise_error(StandardError)
      end
    end
  end
end
