require 'spec_helper_unit'

describe AccountTypeCommands::Update do
  let(:command) { described_class.new(params, logger: logger) }
  let(:params) do
    {
      price_plan: {
        account_type: account_type_literal,
        rate_limit: rate_limit_params
      }
    }
  end
  let(:account_type_literal) { 'FREE' }
  let(:logger) { Carto::Common::Logger.new }
  let(:account_type) { create(:account_type, account_type: account_type_literal) }
  let(:original_rate_limit) { account_type.rate_limit }

  describe '#run' do
    context 'when the associated rate limit has changed' do
      let(:new_rate_limit) { create(:rate_limits_pro) }
      let(:rate_limit_params) { new_rate_limit.api_attributes }

      before { account_type.save }

      it 'updates the rate limit' do
        command.run

        expect(account_type.reload.rate_limit).to eq(new_rate_limit)
      end

      it 'enqueues a job to sync rate limits in Redis' do
        Resque.expects(:enqueue).once.with(
          Resque::UserJobs::RateLimitsJobs::SyncRedis,
          account_type.account_type
        )

        command.run
      end
    end

    context 'when the associated rate limit has not changed' do
      let(:rate_limit_params) { original_rate_limit.api_attributes }

      before { account_type.save }

      it 'does not update the rate limit attributes' do
        command.run

        expect(account_type.reload.rate_limit).to eq(original_rate_limit)
      end

      it 'does not sync rate limit information in Redis' do
        Resque.expects(:enqueue).never

        command.run
      end

      it 'does not create a new rate limit record' do
        expect { command.run }.to change(Carto::RateLimit, :count).by(0)
      end
    end

    context 'when not receiving any rate limit data' do
      let(:params) { { price_plan: { account_type: account_type_literal } } }

      before { account_type.save }

      it 'preserves the current rate limit and raises an error' do
        Resque.expects(:enqueue).never

        expect { command.run }.to raise_error(ActiveRecord::RecordInvalid)

        expect(account_type.reload.rate_limit).to eq(original_rate_limit)
      end
    end

    context 'when the account type does not exist' do
      let(:rate_limit_params) {}

      it 'raises an error' do
        expect { command.run }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
