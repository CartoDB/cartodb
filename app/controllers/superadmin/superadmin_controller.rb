class Superadmin::SuperadminController < ApplicationController
  before_filter :check_admin_user

  layout 'superadmin'

  def check_admin_user
    redirect_to login_path and return unless logged_in?
    redirect_to dashboard_path and return unless current_user.admin
  end
end
