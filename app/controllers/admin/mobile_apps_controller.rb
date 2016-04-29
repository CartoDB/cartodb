# coding: utf-8

class Admin::MobileAppsController < Admin::AdminController
  ssl_required :new, :create, :update, :destroy

  before_filter :invalidate_browser_cache
  before_filter :login_required

  layout 'application'

  def index
    @mobile_apps = []

    respond_to do |format|
      format.html { render 'index' }
    end
  end

  def new
    @mobile_app = MobileApp.new

    respond_to do |format|
      format.html { render 'new' }
    end
  end

  def create
    puts "=================================================================================="
    puts "CREATE METHOD ENTERED"
    puts "=================================================================================="

    redirect_to CartoDB.url(self, 'mobile_apps', {}, current_user), :flash => {:success => "Your app has been added succesfully!"}
  end

  def edit
  end

  def update
  end


  def destroy
  end

end
