module Carto::Urls
  def plan_url(request_protocol)
    account_url(request_protocol) + '/plan'
  end

  def update_payment_url(request_protocol)
    account_url(request_protocol) + '/update_payment'
  end

  def upgrade_url(request_protocol)
    cartodb_com_hosted? ? '' : (account_url(request_protocol) + '/upgrade')
  end

  def account_url(request_protocol)
    request_protocol + CartoDB.account_host + CartoDB.account_path + '/' + username if CartoDB.account_host
  end

  # returns public user url, which is also the base url for a given user
  def public_url(subdomain_override = nil, protocol_override = nil)
    base_subdomain = subdomain_override.nil? ? subdomain : subdomain_override
    CartoDB.base_url(base_subdomain, CartoDB.organization_username(self), protocol_override)
  end

  def avatar
    avatar_url || "//#{default_avatar}"
  end

  def subdomain
    if CartoDB.subdomainless_urls?
      username
    else
      organization.nil? ? username : organization.name
    end
  end
end
