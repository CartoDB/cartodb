# coding: utf-8

module CartoDB
  class FileUpload

    DEFAULT_UPLOADS_PATH = 'public/uploads'
    FILE_ENCODING = 'utf-8'
    MAX_SYNC_UPLOAD_S3_FILE_SIZE = 52428800 # bytes

    def initialize(uploads_path = nil)
      @uploads_path = uploads_path || DEFAULT_UPLOADS_PATH
      unless @uploads_path[0] == "/"
        @uploads_path = Rails.root.join(@uploads_path)
      end
    end

    def get_uploads_path
      @uploads_path
    end

    def upload_file_to_storage(params, request, s3_config = nil, timestamp = Time.now)
      results = {
        file_uri: nil,
        enqueue:  true
      }

      # Used by cartodb chrome extension
      ajax_upload = false
      case
      when params[:filename].present? && request.body.present?
        filename = params[:filename].original_filename rescue params[:filename].to_s
        begin
          filepath = params[:filename].path
        rescue
          filepath = params[:filename].to_s
          ajax_upload = true
        end
      when params[:file].present?
        filename = params[:file].original_filename rescue params[:file].to_s
        filepath = params[:file].path rescue ''
      else
        return results
      end

      filename = filename.gsub(/ /, '_')

      random_token = Digest::SHA2.hexdigest("#{timestamp.utc}--#{filename.object_id.to_s}").first(20)

      use_s3 = !s3_config.nil? && s3_config['access_key_id'].present? && s3_config['secret_access_key'].present? &&
               s3_config['bucket_name'].present? && s3_config['url_ttl'].present?

      file = nil
      if ajax_upload
        file = save_body_to_file(params, request, random_token, filename)
        filepath = file.path
      end

      do_long_upload = s3_config['async_long_uploads'].present? && s3_config['async_long_uploads'] &&
        File.size(filepath) > MAX_SYNC_UPLOAD_S3_FILE_SIZE

      if use_s3 && !do_long_upload
        file_url = upload_file_to_s3(filepath, filename, random_token, s3_config)

        if ajax_upload
          File.delete(file.path)
        end

        results[:file_uri] = file_url
      else
        unless ajax_upload
          file = save_body_to_file(params, request, random_token, filename)
        end

        if use_s3 && do_long_upload
          results[:file_uri] = file.path[/(\/uploads\/.*)/, 1]
          results[:enqueue] = false
        else
          results[:file_uri] = file.path[/(\/uploads\/.*)/, 1]
        end
      end

      results
    end

    def upload_file_to_s3(filepath, filename, token, s3_config)
      AWS.config(
        access_key_id: s3_config['access_key_id'],
        secret_access_key: s3_config['secret_access_key'],
        proxy_uri: (s3_config['proxy_uri'].present? ?  s3_config['proxy_uri'] : nil),
        use_ssl: s3_config['use_ssl'],
        s3_endpoint: s3_config['s3_endpoint'],
        s3_port:  s3_config['s3_port'],
        s3_force_path_style: s3_config['s3_force_path_style']
      )
      
      s3_bucket = AWS::S3.new.buckets[s3_config['bucket_name']]

      path = "#{token}/#{File.basename(filename)}"
      o = s3_bucket.objects[path]

      o.write(Pathname.new(filepath), { acl: :authenticated_read })

      o.url_for(:get, expires: s3_config['url_ttl']).to_s
    end

    private

    def save_body_to_file(params, request, random_token, filename)
      case
      when params[:filename].present? && request.body.present?
        filedata = params[:filename]
      when params[:file].present?
        filedata = params[:file]
      else
        return
      end

      FileUtils.mkdir_p(get_uploads_path.join(random_token))

      if filedata.respond_to?(:tempfile)
        save_using_streaming(filedata, random_token, filename)
      else
        begin
          data = filedata.read.force_encoding(FILE_ENCODING)
        rescue
          data = request.body.read.force_encoding(FILE_ENCODING)
        end
        save(data, random_token, filename)
      end
    end

    def save(filedata, random_token, filename)
      file = File.new(get_uploads_path.join(random_token).join(File.basename(filename)), "w:#{FILE_ENCODING}")
      file.write filedata
      file.close
      file
    end

    def save_using_streaming(filedata, random_token, filename)
      src = File.open(filedata.tempfile.path, "r:UTF-8")
      file = File.new(get_uploads_path.join(random_token).join(File.basename(filename)), 'w:UTF-8')
      IO.copy_stream(src, file)
      file.close
      src.close
      file
    end
  end
end
