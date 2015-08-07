class AccountTokensController < ApplicationController
  layout 'frontend'

  ssl_required :enable, :resend

  skip_before_filter :ensure_account_has_been_activated, :only => :enable

  def enable
    token = params[:id]
    render_400 and return unless token

    user = User.where(enable_account_token: token).first
    render(file: 'signup/account_already_enabled', status: 404) and return unless user

    authenticate!(:enable_account_token, scope: params[:user_domain].present? ?  params[:user_domain] : user.username)

    @user = user.reload
    @organization = @user.organization
    @destination_url = CartoDB.url(self, 'dashboard', {}, @user)

    flash.now[:success] = 'Account enabled, yikes!'
    render 'signup/account_enabled'
  end

  def resend
    user_id = params[:user_id]
    render_404 and return unless user_id
    @user = User.where(id: user_id).first
    render_404 and return unless @user

    @organization = @user.organization
    @user.notify_new_organization_user

    render 'signup/resend'
  end

end
