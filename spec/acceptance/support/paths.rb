module NavigationHelpers
  def homepage
    "/"
  end

  def login_path
    "/login"
  end
end

RSpec.configuration.include NavigationHelpers, :type => :acceptance
