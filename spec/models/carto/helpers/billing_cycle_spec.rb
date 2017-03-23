require_relative '../../../../app/models/carto/helpers/billing_cycle'
require 'ostruct'
require 'delorean'

describe Carto::BillingCycle do
  describe :last_billing_cycle do
    class MyDummyUser < OpenStruct
      include Carto::BillingCycle
    end

    before(:each) do
      @user = MyDummyUser.new
    end

    after(:each) do
      @user = nil
    end

    [
      { today: '2017-02-21', expected: '2017-01-23' },
      { today: '2017-01-01', expected: '2016-12-03' },
      { today: '2017-01-31', expected: '2017-01-02' },
      { today: '2017-02-01', expected: '2017-01-03' },
      { today: '2017-02-28', expected: '2017-01-30' },
      { today: '2017-03-01', expected: '2017-02-28' },
      { today: '2017-03-31', expected: '2017-03-02' }
    ].each do |example|
      today = example[:today]
      expected = example[:expected]
      it "arbitrarily assumes period_end_date.day = 29.days.ago.day if no period_end_date" \
         " (today = #{today}, expected = #{expected})" do
        # See commit 83850567
        # Maybe better to throw an error if that happens?
        @user.period_end_date = nil
        Delorean.time_travel_to(today) do
          @user.last_billing_cycle.should eq Date.parse(expected)
        end
      end
    end

    [
      { today: '2017-03-21', period_end_date: '2017-02-21', expected: '2017-03-21' },
      { today: '2017-03-21', period_end_date: '2017-02-01', expected: '2017-03-01' },
      { today: '2017-02-21', period_end_date: '2017-01-01', expected: '2017-02-01' },
      { today: '2017-01-31', period_end_date: '2016-10-31', expected: '2017-01-31' },
      { today: '2017-03-01', period_end_date: '2016-10-01', expected: '2017-03-01' }
    ].each do |example|
      today = example[:today]
      period_end_date = example[:period_end_date]
      expected = example[:expected]
      it "returns the current month if period_end_date.day <= today.day" \
      " (today = #{today}, period_end_date = #{period_end_date}, expected = #{expected})" do
        @user.period_end_date = Date.parse(period_end_date)
        Delorean.time_travel_to(today) do
          @user.last_billing_cycle.should eq Date.parse(expected)
        end
      end
    end

    [
      { today: '2017-03-20', period_end_date: '2017-02-21', expected: '2017-02-21' },
      { today: '2017-03-01', period_end_date: '2017-02-21', expected: '2017-02-21' },
      { today: '2017-02-01', period_end_date: '2017-01-21', expected: '2017-01-21' },
      { today: '2017-01-30', period_end_date: '2016-10-31', expected: '2016-12-31' },
      { today: '2017-03-01', period_end_date: '2016-10-02', expected: '2017-02-02' }
    ].each do |example|
      today = example[:today]
      period_end_date = example[:period_end_date]
      expected = example[:expected]
      it "returns the previous month if period_end_date.day > today.day" \
      " (today = #{today}, period_end_date = #{period_end_date}, expected = #{expected})" do
        @user.period_end_date = Date.parse(period_end_date)
        Delorean.time_travel_to(today) do
          @user.last_billing_cycle.should eq Date.parse(expected)
        end
      end
    end

    [
      { today: '2017-03-21', period_end_date: '2017-01-31', expected: '2017-02-28' },
      # 2020 is a leap year
      { today: '2020-03-21', period_end_date: '2017-01-31', expected: '2020-02-29' },
      { today: '2017-05-21', period_end_date: '2017-01-31', expected: '2017-04-30' }
    ].each do |example|
      today = example[:today]
      period_end_date = example[:period_end_date]
      expected = example[:expected]
      it "returns the previous valid day when dealing with 28, 29 or 30-day month corner cases" \
      " (today = #{today}, period_end_date = #{period_end_date}, expected = #{expected})" do
        @user.period_end_date = Date.parse(period_end_date)
        Delorean.time_travel_to(today) do
          @user.last_billing_cycle.should eq Date.parse(expected)
        end
      end
    end
  end
end
