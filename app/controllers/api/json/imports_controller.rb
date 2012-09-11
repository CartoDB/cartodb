#encoding: UTF-8
class Api::Json::ImportsController < Api::ApplicationController
  ssl_required :index, :show, :create

  def index
    imports = DataImport.filter(:user_id => current_user.id).all
    render :json => {:imports => imports, :success => true}
  end

  def show
    import        = DataImport.filter(:queue_id => params[:id]).first
    import_values = import.values rescue { :state => 'preprocessing' }

    success = import_values[:state].blank? || import_values[:state] != 'failure'
    render :json => import_values, :status => success ? :ok : :ok
  end

  def create
    file_uri = params[:url].present? ? params[:url] : upload_file

    if synchronous_import?
      #@data_import = Resque::ImporterJobs.process(current_user[:id], params[:table_name], file_uri)
      #render :json => {:item_queue_id => job_meta.meta_id, :success => true}
    else
      job = Resque::ImporterJobs.enqueue(current_user[:id], params[:table_name], file_uri)
      render_jsonp({:item_queue_id => job.meta_id, :success => true})
    end
  #rescue => e
  #  render_jsonp({ :description => e.message, :code => (@data_import.error_code rescue '') }, 400)
  end

  protected

  def synchronous_import?
    params[:synchronous].present?
  end

  def upload_file
    temp_file = filename = filedata = nil

    case
    when params[:filename].present? && request.body.present?
      filename = params[:filename].original_filename rescue params[:filename].to_s
      filedata = request.body.read.force_encoding('utf-8')
    when params[:file].present?
      filename = params[:file].original_filename rescue params[:file].to_s
      filedata = params[:file].read.force_encoding('utf-8')
    end

    random_token = Digest::SHA2.hexdigest("#{Time.now.utc}--#{filename.object_id.to_s}").first(20)

    FileUtils.mkdir_p(Rails.root.join('public/uploads').join(random_token))

    file = File.new(Rails.root.join('public/uploads').join(random_token).join(File.basename(filename)), 'w')
    file.write filedata
    file.close

    return file.path[/(\/uploads\/.*)/, 1]
  end

end
