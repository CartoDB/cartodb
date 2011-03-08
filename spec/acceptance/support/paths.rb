module NavigationHelpers
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
end

RSpec.configuration.include NavigationHelpers, :type => :acceptance
