require_relative '../../../spec_helper'

describe CartoDB::Stats::Platform do
  describe '#pay_users' do
    it 'returns only paid users' do
      pay_users = CartoDB::Stats::Platform.new.pay_users

      create(:user, account_type: 'FREE')
      create(:user, account_type: 'MAGELLAN')

      CartoDB::Stats::Platform.new.pay_users.should == (pay_users + 1)
    end
  end
end
