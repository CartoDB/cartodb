class HomeController < ApplicationController

  before_filter :login_required

  def index
    render :text => "Logged in: #{current_user.inspect}"
  end

end
