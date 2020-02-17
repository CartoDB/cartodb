require 'active_support/time'

module Carto::Billing
  def last_billing_cycle
    day = period_end_date.day
    date = day > Date.today.day ? (Date.today - 1.month) : Date.today
    begin
      Date.new(date.year, date.month, day)
    rescue ArgumentError
      day = day - 1
      retry
    end
  end

  def next_billing_cycle
    day = period_end_date.day
    date = day > Date.today.day ? Date.today : Date.today + 1.month
    begin
      Date.new(date.year, date.month, day)
    rescue ArgumentError
      day = day - 1
      retry
    end
  end

  def trial_ends_at
    return nil unless Carto::AccountType::TRIAL_PLANS.include?(account_type)

    trial_days = Carto::AccountType::TRIAL_DAYS[account_type].days
    created_at + trial_days
  end

  def remaining_trial_days
    return 0 if trial_ends_at.nil? || trial_ends_at < Time.now

    ((trial_ends_at - Time.now) / 1.day).ceil
  end

  def show_trial_reminder?
    return false unless trial_ends_at

    trial_ends_at > Time.now
  end
end
