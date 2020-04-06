# This file should be synched with Central
module AccountTypeHelper
  # Customer-facing plan name. Front is responsible of shortening long ones.
  def plan_name(account_type)
    PLAN_NAME_BY_ACCOUNT_TYPE_DOWN.fetch(account_type.downcase, account_type)
  end

  def plan_name_no_time(account_type)
    plan_name(account_type).gsub(' - Monthly', '').gsub(' - Annual', '')
  end

  def plan_name_no_trial(account_type)
    plan_name(account_type).gsub(' Trial', '')
  end

  def public_plan_name(account_type)
    PUBLIC_PLAN_NAME.fetch(account_type)
  end

  # "private": use the methods instead

  PUBLIC_PLAN_NAME = {
    'FREE' => 'Free',
    'Individual' => 'Individual',
    'Annual Individual' => 'Annual Individual',
    'PERSONAL30' => 'Professional',
    'BASIC' => 'Professional',
    'BASIC LUMP-SUM' => 'Professional Lump-Sum',
    'ENTERPRISE' => 'Enterprise',
    'Free 2020' => 'Free'
  }.freeze

  PLAN_NAME_BY_ACCOUNT_TYPE = {
    'FREE' => 'Free',
    'Individual' => 'Individual',
    'Annual Individual' => 'Annual Individual',
    'PERSONAL30' => 'Professional',
    'BASIC' => 'Professional',
    'BASIC LUMP-SUM' => 'Professional',
    'BASIC ACADEMIC' => 'Professional Non-Profit',
    'BASIC NON-PROFIT' => 'Professional Non-Profit',
    'BASIC LUMP-SUM ACADEMIC' => 'Professional Non-Profit',
    'BASIC LUMP-SUM NON-PROFIT' => 'Professional Non-Profit',
    'Enterprise Builder - Annual' => 'Enterprise',
    'Cloud Engine & Enterprise Builder - Annual' => 'Enterprise',
    'Internal use engine - Cloud - Annual' => 'Enterprise Engine',
    'Internal use engine - On-premises - Annual' => 'Enterprise Engine',
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
    'CARTO Trial Account - Annual' => 'Trial',
    'Free 2020' => 'Free',
    'Grant' => 'Grant'
  }.freeze

  PLAN_NAME_BY_ACCOUNT_TYPE_DOWN = Hash[PLAN_NAME_BY_ACCOUNT_TYPE.map { |k, v| [k.downcase, v] }]
end
