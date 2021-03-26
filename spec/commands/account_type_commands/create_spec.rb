require 'spec_helper_unit'

describe AccountTypeCommands::Create do
  let(:command) { described_class.new(params) }
  let(:params) do
    {
      price_plan: {
        account_type: account_type_literal,
        rate_limit: rate_limit_params
      }
    }
  end
  let(:rate_limit_params) { create(:rate_limits).api_attributes }
  let(:account_type_literal) { 'FREE' }
  let(:created_account_type) { Carto::AccountType.find(account_type_literal) }

  describe '#run' do
    context 'when everything is ok' do
      before { command.run }

      it 'creates the account type' do
        expect(created_account_type).to be_present
        expect(created_account_type.account_type).to eq(account_type_literal)
      end

      it 'creates the corresponding rate limit' do
        expect(created_account_type.rate_limit).to be_present
      end
    end

    context 'when an error occurs' do
      let(:rate_limit_params) { nil }

      it 'raises an error' do
        expect { command.run }.to raise_error(ActiveRecord::StatementInvalid)
      end
    end

    context 'when the account type already exists' do
      before { create(:account_type, account_type: account_type_literal) }

      it 'updates it' do
        expect { command.run }.to change(Carto::AccountType, :count).by(0)
      end
    end
  end
end
