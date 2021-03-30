require 'spec_helper_unit'

describe AccountTypeCommands::Delete do
  let(:command) { described_class.new(params, logger: logger) }
  let(:params) { { price_plan: { account_type: account_type_literal } } }
  let(:account_type_literal) { 'FREE' }
  let(:logger) { Carto::Common::Logger.new }
  let!(:account_type) { create(:account_type, account_type: account_type_literal) }

  describe '#run' do
    context 'when everything is ok' do
      before { command.run }

      it 'deletes the account type' do
        expect { account_type.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context 'when the account type does not exist' do
      before { account_type.destroy! }

      it 'logs a message and does not fail' do
        logger.expects(:warn).with(
          command_class: 'AccountTypeCommands::Delete',
          request_id: nil,
          account_type: 'FREE',
          message: 'AccountType not found'
        )

        command.run
      end
    end
  end
end
