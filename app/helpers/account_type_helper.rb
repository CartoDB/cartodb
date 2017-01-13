# This file should be synched with Central
module AccountTypeHelper
  # Customer-facing plan name. Front is responsible of shortening long ones.
  def plan_name(account_type)
    PLAN_NAME_BY_ACCOUNT_TYPE_DOWN.fetch(account_type.downcase, account_type)
  end

  def plan_name_no_time(account_type)
    plan_name(account_type).gsub(' - Monthly', '').gsub(' - Annual', '')
  end

  private

  PLAN_NAME_BY_ACCOUNT_TYPE = {
    'FREE' => 'Free',
    'BASIC' => 'Personal',
    'BASIC LUMP-SUM' => 'Personal',
    'BASIC ACADEMIC' => 'Personal Non-Profit',
    'BASIC NON-PROFIT' => 'Personal Non-Profit',
    'BASIC LUMP-SUM ACADEMIC' => 'Personal Non-Profit',
    'BASIC LUMP-SUM NON-PROFIT' => 'Personal Non-Profit',
    'Enterprise Builder - Annual' => 'Enterprise',
    'Enterprise Builder - On-premises - Annual' => 'Enterprise',
    'Cloud Engine & Enterprise Builder - Annual' => 'Enterprise',
    'Internal use engine - Cloud - Annual' => 'Internal',
    'Internal use engine - On-premises - Annual' => 'Internal',
    'Internal use engine - On-premises Lite - Annual' => 'Internal',
    'OEM engine - Cloud - Annual' => 'Enterprise',
    'OEM engine - On-premises - Annual' => 'Enterprise',
    'PARTNERS' => 'Partner',
    'CARTO for the Classroom - Annual' => 'Student',
    'Site License' => 'Student',
    'CARTO for students - Annual' => 'Student',
    'AMBASSADOR' => 'Ambassador',
    'ire' => 'Ambassador',
    'CARTO for Community - Annual' => 'Ambassador',
    'Free Basemap LDS - Annual' => 'Free',
    'Enterprise LDS - Annual' => 'Enterprise',
    'CARTO Trial Account - Annual' => 'Trial'
  }.freeze

  PLAN_NAME_BY_ACCOUNT_TYPE_DOWN = Hash[PLAN_NAME_BY_ACCOUNT_TYPE.map { |k, v| [k.downcase, v] }]
end
