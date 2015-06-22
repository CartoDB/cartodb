class AccountTokensController < ApplicationController
  layout 'frontend'

  ssl_required :enable

  def enable
    token = params[:id]
    render_404 and return unless token

    user = User.where(enable_account_token: token).first
    render_404 and return unless user

    user.enable_account_token = nil
    user.save

    @user = user
    flash.now[:success] = 'Account enabled, yikes!'
    render 'signup/account_enabled'
  end

  def resend
    user_id = params[:user_id]
    render_404 and return unless user_id
    @user = User.where(id: user_id).first
    render_404 and return unless @user

    @user.notify_new_organization_user

    render 'signup/resend'
  end

end
