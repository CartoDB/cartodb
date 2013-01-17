# coding: utf-8

class Admin::PagesController < ApplicationController
  ssl_required :public_tables

  before_filter      :login_required

end
