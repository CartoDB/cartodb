module NavigationHelpers
  def homepage
    "/"
  end

  def login_path
    "/login"
  end

  def dashboard_path
    "/dashboard"
  end
end

RSpec.configuration.include NavigationHelpers, :type => :acceptance
