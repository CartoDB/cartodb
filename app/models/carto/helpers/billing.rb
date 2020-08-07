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

    created_at + Carto::AccountType::TRIAL_DURATION[account_type]
  end

  def remaining_trial_days
    return 0 if trial_ends_at.nil? || trial_ends_at < Time.now

    ((trial_ends_at - Time.now) / 1.day).ceil
  end

  def show_trial_reminder?
    remaining_trial_days.between?(1, 30)
  end

  def remaining_days_deletion
    return nil unless state == STATE_LOCKED

    deletion_date = Cartodb::Central.new.get_user(username).fetch('scheduled_deletion_date', nil)
    return nil unless deletion_date

    (deletion_date.to_date - Date.today).to_i
  rescue StandardError => e
    log_warning(exception: e, message: 'Error calculating remaining days for account deletion')
    nil
  end

  def enterprise?
    Carto::AccountType::ENTERPRISE_PLANS.include?(account_type)
  end
end
