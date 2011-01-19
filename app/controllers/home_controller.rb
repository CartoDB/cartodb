class HomeController < ApplicationController

  layout 'front_layout'

  def index
    if logged_in?
      redirect_to dashboard_path and return
    else
      redirect_to login_path and return
    end
  end

end
