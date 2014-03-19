# coding: utf-8

class Admin::PagesController < ApplicationController
  ssl_required :common_data, :public

  before_filter      :login_required

  def public
  end
end
