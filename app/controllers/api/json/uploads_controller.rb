class Api::Json::UploadsController < Api::ApplicationController

  ssl_required :create

  skip_before_filter :verify_authenticity_token
  before_filter :api_or_user_authorization_required

  def create
    @stats_aggregator.timing('uploads.create') do

      begin
        temp_file = filename = filedata = nil

        case
        when params[:filename].present? && request.body.present?
          filename = params[:filename]
          filedata = request.body.read.force_encoding('utf-8')
        when params[:file].present?
          filename = params[:file].original_filename
          filedata = params[:file].read.force_encoding('utf-8')
        end

        random_token = Digest::SHA2.hexdigest("#{Time.now.utc}--#{filename.object_id.to_s}").first(20)

        file_upload_helper = CartoDB::FileUpload.new(Cartodb.get_config(:importer, 'uploads_path'))
        file_upload_helper.get_uploads_path

        @stats_aggregator.timing('save') do
          FileUtils.mkdir_p(file_upload_helper.get_uploads_path.join(random_token))
          file = File.new(file_upload_helper.get_uploads_path.join(random_token).join(File.basename(filename)), 'w')
          file.write filedata
          file.close
        end

        render :json => {:file_uri => file.path[/(\/uploads\/.*)/, 1], :success => true}
      rescue StandardError => e
        logger.error e
        logger.error e.backtrace
        head(400)
      end

    end
  end

  def api_or_user_authorization_required
    api_authorization_required || login_required
  end
  private :api_or_user_authorization_required

end
