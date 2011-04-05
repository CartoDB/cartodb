# coding: UTF-8

class HomeController < ApplicationController

  layout 'front_layout'

  def index
    if logged_in?
      redirect_to dashboard_path and return
    else
      @user = User.new
    end
  end

  def status

    status = begin
      Rails::Sequel.connection.select('OK').first.values.include?('OK') ? :success : :error
    rescue Exception => e
      :error
    end

    head :success
  end

end
