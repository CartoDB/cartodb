class Admin::AdminController < ApplicationController
  before_filter :x_frame_options_deny

  protected
  
  def x_frame_options_deny
    response.headers['X-Frame-Options'] = 'DENY'
  end
end
