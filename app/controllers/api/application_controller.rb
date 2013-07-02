# coding: utf-8
class Api::ApplicationController < ApplicationController
  skip_before_filter :browser_is_html5_compliant?, :verify_authenticity_token
  before_filter :api_authorization_required

  protected

  def set_start_time
    @time_start = Time.now
  end

  # dry up the jsonp output
  def render_jsonp obj, status = 200, options = {}
    options.reverse_merge! :json => obj, :status => status, :callback => params[:callback]
    render options
  end

  def link_ghost_tables
    return true unless current_user.present?
    current_user.link_ghost_tables
  end
end
