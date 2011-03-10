module NavigationHelpers
  API_HOST = "http://api.localhost.lan"

  def homepage
    "/"
  end

  def login_path
    "/login"
  end

  def logout_path
    "/logout"
  end

  def dashboard_path
    "/dashboard"
  end

  def superadmin_path
    "/superadmin"
  end

  def api_query_url
    "#{API_HOST}/#{CartoDB::API::VERSION_1}/"
  end

end

RSpec.configuration.include NavigationHelpers, :type => :acceptance
