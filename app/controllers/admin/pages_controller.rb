# coding: utf-8

class Admin::PagesController < ApplicationController
  ssl_required :common_data, :public

  before_filter      :login_required, :except => :public

  def public
    respond_to do |format|
      format.html { render 'public', layout: 'application_public' }
    end
  end
end
