class Admin::UsersController < Admin::AdminController
  include LoginHelper

  ssl_required  :account, :profile, :lockout, :maintenance, :unverified

  before_filter :invalidate_browser_cache
  before_filter :login_required
  before_filter :setup_user

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

  def unverified
    if current_user.unverified?
      url = Cartodb::Central.new.unverified_url
      redirect_to url
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
