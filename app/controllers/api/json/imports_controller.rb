#encoding: UTF-8
class Api::Json::ImportsController < Api::ApplicationController
  ssl_required :index, :show, :create

  def index
    imports = current_user.importing_jobs
    render json: { imports: imports.map(&:id), success: true }
  end

  def show
    data_import = DataImport[params[:id]]
    data_import.mark_as_failed_if_stuck!
    render json: data_import.reload.public_values
  end

  def create
    file_uri = params[:url].present? ? params[:url] : _upload_file

    options = { user_id: current_user.id,
                table_name:  params[:table_name].presence,
                data_source: file_uri.presence,
                table_id:    params[:table_id].presence,
                append:      (params[:append].presence == 'true'),
                table_copy:  params[:table_copy].presence,
                from_query:  params[:sql].presence }
      
    data_import = DataImport.create(options)
    Resque.enqueue(Resque::ImporterJobs, job_id: data_import.id)

    render_jsonp({ item_queue_id: data_import.id, success: true })
  end

  protected

  def synchronous_import?
    params[:synchronous].present?
  end

  def _upload_file
    temp_file = filename = filedata = nil

    case
    when params[:filename].present? && request.body.present?
      filename = params[:filename].original_filename rescue params[:filename].to_s
      filedata = params[:filename].read.force_encoding('utf-8') rescue request.body.read.force_encoding('utf-8')
    when params[:file].present?
      filename = params[:file].original_filename rescue params[:file].to_s
      filedata = params[:file].read.force_encoding('utf-8')
    else
      return
    end

    random_token = Digest::SHA2.hexdigest("#{Time.now.utc}--#{filename.object_id.to_s}").first(20)

    s3_uploader = S3Uploader.new(Cartodb.config)

    if s3_uploader.configured?
      path = "#{random_token}/#{File.basename(filename)}"
      s3_public_url = s3_uploader.upload(path, filedata)
      s3_uploader.presigned_url_for(s3_public_url)
    else
      FileUtils.mkdir_p(Rails.root.join('public/uploads').join(random_token))

      file = File.new(Rails.root.join('public/uploads').join(random_token).join(File.basename(filename)), 'w')
      file.write filedata
      file.close
      return file.path[/(\/uploads\/.*)/, 1]
    end
  end
end
