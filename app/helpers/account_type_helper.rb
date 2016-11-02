module AccountTypeHelper
  # Customer-facing plan name. Front is responsible of shortening long ones.
  def plan_name(account_type)
    plan = PLAN_NAME_BY_ACCOUNT_TYPE.fetch(account_type.downcase, account_type)

  end

  private

  PLAN_NAME_BY_ACCOUNT_TYPE = {
    'organization user' => 'org. user',
    'free' => 'Free',
    'basic' => 'Basic Builder - Monthly',
    'ls-basic' => 'Basic Builder - Annual',
    'aca-basic' => 'Basic Builder - Non-Profit - Monthly',
    'nonprofit-basic' => 'Basic Builder - Non-Profit - Monthly',
    'ls-aca-basic' => 'Basic Builder - Non-Profit - Annual',
    'ls-nonprofit-basic' => 'Basic Builder - Non-Profit - Annual',
    'enterprise-builder' => 'Enterprise Builder',
    'onpremise-builder' => 'Enterprise Builder - On-premises',
    'enterprise-builder-engine' => 'Cloud Engine & Enterprise Builder',
    'engine' => 'Internal use engine - Cloud',
    'onpremise-engine' => 'Internal use engine - On-premises',
    'onpremise-lite-engine' => 'Internal use engine - On-premises Lite',
    'oem-engine' => 'OEM engine - Cloud',
    'onpremise-oem-engine' => 'OEM engine - On-premises',
    'partner' => 'Engine for Partners',
    'classroom' => 'CARTO for the Classroom',
    'site-license' => 'CARTO for Education - Site License',
    'student-engine' => 'CARTO for students',
    'ambassador' => 'CARTO for Ambassadors',
    'ire' => 'CARTO for Ambassadors',
    'community-engine' => 'CARTO for Community',
    'lds' => 'Free Basemap LDS',
    'enterprise-lds' => 'Enterprise LDS',
    'trial' => 'CARTO Trial Account'
  }.freeze
end
