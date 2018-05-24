# coding: utf-8

require_relative '../../../lib/cartodb/stats/editor_apis'

class Api::ApplicationController < ApplicationController
  protect_from_forgery with: :null_session

  # Don't force org urls
  skip_before_filter :ensure_org_url_if_org_user, :browser_is_html5_compliant?
  skip_before_filter :verify_authenticity_token, if: :json_formatted_request?

  before_filter :api_authorization_required
  before_filter :ensure_account_has_been_activated

  before_filter :setup_stats_instance

  protected

  def set_start_time
    @time_start = Time.now
  end

  # dry up the jsonp output
  def render_jsonp(obj, status = 200, options = {})
    if callback_valid?
      options.reverse_merge! :json => obj, :status => status, :callback => params[:callback]
    else
      options.reverse_merge! :json => { errors: { callback: "Invalid callback format" } }, :status => 400
    end
    render options
  end

  def setup_stats_instance
    @stats_aggregator = CartoDB::Stats::EditorAPIs.instance
  end

  def valid_password_confirmation
    unless current_user.valid_password_confirmation(params[:password_confirmation])
      raise Carto::PasswordConfirmationError.new
    end
  end

  private

  def callback_valid?
    # While only checks basic characters, represents most common use of JS function names
    params[:callback].nil?  || !!(params[:callback] =~ /\A[$a-z_][0-9a-z_$]*\z/i)
  end
end
