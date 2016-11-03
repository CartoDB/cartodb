module AccountTypeHelper
  # Customer-facing plan name. Front is responsible of shortening long ones.
  def plan_name(account_type)
    PLAN_NAME_BY_ACCOUNT_TYPE.fetch(account_type.downcase, account_type)
  end

  private

  PLAN_NAME_BY_ACCOUNT_TYPE = {
    'FREE' => 'Free Builder',
    'BASIC' => 'Basic Builder - Monthly',
    'BASIC LUMP-SUM' => 'Basic Builder - Annual',
    'BASIC ACADEMIC' => 'Basic Builder - Non-Profit - Monthly',
    'BASIC NON-PROFIT' => 'Basic Builder - Non-Profit - Monthly',
    'BASIC LUMP-SUM ACADEMIC' => 'Basic Builder - Non-Profit - Annual',
    'BASIC LUMP-SUM NON-PROFIT' => 'Basic Builder - Non-Profit - Annual',
    'Enterprise Builder - Annual' => 'Enterprise Builder',
    'Enterprise Builder - On-premises - Annual' => 'Enterprise Builder - On-premises',
    'Cloud Engine & Enterprise Builder - Annual' => 'Cloud Engine & Enterprise Builder',
    'Internal use engine - Cloud - Annual' => 'Internal use engine - Cloud',
    'Internal use engine - On-premises - Annual' => 'Internal use engine - On-premises',
    'Internal use engine - On-premises Lite - Annual' => 'Internal use engine - On-premises Lite',
    'OEM engine - Cloud - Annual' => 'OEM engine - Cloud',
    'OEM engine - On-premises - Annual' => 'OEM engine - On-premises',
    'PARTNERS' => 'Engine for Partners',
    'CARTO for the Classroom - Annual' => 'CARTO for the Classroom',
    'Site License' => 'CARTO for Education - Site License',
    'CARTO for students - Annual' => 'CARTO for students',
    'AMBASSADOR' => 'CARTO for Ambassadors',
    'ire' => 'CARTO for Ambassadors',
    'CARTO for Community - Annual' => 'CARTO for Community',
    'Free Basemap LDS - Annual' => 'Free Basemap LDS',
    'Enterprise LDS - Annual' => 'Enterprise LDS',
    'CARTO Trial Account - Annual' => 'CARTO Trial Account'
  }.freeze
end
