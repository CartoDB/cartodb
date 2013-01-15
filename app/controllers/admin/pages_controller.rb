# coding: utf-8

class Admin::PagesController < ApplicationController
  ssl_required :index, :show

  skip_before_filter :browser_is_html5_compliant?, :only => [:embed_map]
  before_filter      :login_required,              :only => [:index]
  before_filter      :update_user_api_calls,       :only => [:index, :show]
  after_filter       :update_user_last_activity,   :only => [:index, :show]

  def tables
  end

end
