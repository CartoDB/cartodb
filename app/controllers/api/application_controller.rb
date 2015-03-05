# coding: utf-8
class Api::ApplicationController < ApplicationController
  # Don't force org urls
  skip_before_filter :ensure_org_url_if_org_user, :browser_is_html5_compliant?, :verify_authenticity_token
  before_filter :api_authorization_required

  protected

  def set_start_time
    @time_start = Time.now
  end

  # dry up the jsonp output
  def render_jsonp obj, status = 200, options = {}
    options.reverse_merge! :json => obj, :status => status, :callback => sanitize_callback(params[:callback])
    render options
  end

  private

  def sanitize_callback(callback)
    # While only checks basic characters, most common use of JS function names
    !!(callback =~ /^[$a-z_][0-9a-z_$]*$/i) ? params[:callback] : nil
  end

end
