class Admin::AdminController < ApplicationController
  before_filter :x_frame_options_deny

  protected

  def x_frame_options_deny
    response.headers['X-Frame-Options'] = 'DENY'
  end

  def invalidate_browser_cache
    response.headers['Cache-Control'] = 'no-cache, no-store, max-age=0, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = 'Mon, 01 Jan 1990 00:00:00 GMT'
  end
end
