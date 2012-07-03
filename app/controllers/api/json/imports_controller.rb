class Api::Json::ImportsController < Api::ApplicationController

  if Rails.env.production?
    ssl_required :create
  end

  def index
    imports = DataImport.filter(:user_id => current_user.id).all

    render :json => {:imports => imports, :success => true}
  end

  def show
    import = DataImport.filter(:queue_id => params[:id]).first

    render :json => {:import => import.values, :success => true}
  end

  def create
    async = params[:async] == 'false' ? false : true
    job_meta = Resque::ImporterJobs.enqueue(current_user[:id], params[:file_uri]) if async

    render :json => {:item_queue_id => job_meta.meta_id, :success => true}
  end

end
