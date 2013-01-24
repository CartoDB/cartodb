# coding: utf-8

class Admin::PagesController < ApplicationController
  ssl_required :common_data

  before_filter      :login_required

end
