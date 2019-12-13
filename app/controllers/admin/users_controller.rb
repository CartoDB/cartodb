class Admin::UsersController < Admin::AdminController
  include LoginHelper

  ssl_required  :account, :profile, :lockout, :maintenance

  before_action :invalidate_browser_cache
  before_action :login_required
  before_action :setup_user

  layout 'application'

  def profile
    render(file: "public/static/profile/index.html", layout: false)
  end

  def account
    render(file: "public/static/account/index.html", layout: false)
  end

  def lockout
    if current_user.locked?
      @expiration_days = @user.remaining_days_deletion
      @payments_url = @user.plan_url(request.protocol)
      render locals: { breadcrumb: false }
    else
      render_404
    end
  end

  def maintenance
    if current_user.maintenance_mode?
      render locals: { breadcrumb: false }
    else
      render_404
    end
  end

  private

  def setup_user
    @user = current_user
  end
end
