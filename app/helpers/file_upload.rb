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

    def upload_file_to_storage(filename_param: nil,
                               file_param: nil,
                               request_body: nil,
                               s3_config: nil,
                               timestamp: Time.now)
      results = {
        file_uri: nil,
        enqueue:  true
      }

      load_file_from_request_body = false
      case
      when filename_param.present? && request_body.present?
        filename = filename_param.original_filename rescue filename_param.to_s
        begin
          filepath = filename_param.path
        rescue
          filepath = filename_param.to_s
          load_file_from_request_body = true
        end
      when file_param.present?
        filename = file_param.original_filename rescue file_param.to_s
        filepath = file_param.path rescue ''
      else
        return results
      end

      filename = filename.gsub(/ /, '_')

      random_token = Digest::SHA2.hexdigest("#{timestamp.utc}--#{filename.object_id.to_s}").first(20)

      use_s3 = !s3_config.nil? && s3_config['access_key_id'].present? && s3_config['secret_access_key'].present? &&
               s3_config['bucket_name'].present? && s3_config['url_ttl'].present?

      file = nil
      if load_file_from_request_body
        file = filedata_from_params(filename_param, file_param, request_body, random_token)
        filepath = file.path
      end

      do_long_upload = s3_config && s3_config['async_long_uploads'].present? && s3_config['async_long_uploads'] &&
        File.size(filepath) > MAX_SYNC_UPLOAD_S3_FILE_SIZE

      if use_s3 && !do_long_upload
        file_url = upload_file_to_s3(filepath, filename, random_token, s3_config)

        if load_file_from_request_body
          File.delete(file.path)
        end

        results[:file_uri] = file_url
      else
        unless load_file_from_request_body
          file = filedata_from_params(filename_param, file_param, request_body, random_token)
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
        use_ssl: s3_config['use_ssl']
      )
      s3_bucket = AWS::S3.new.buckets[s3_config['bucket_name']]

      path = "#{token}/#{File.basename(filename)}"
      o = s3_bucket.objects[path]
      o.write(Pathname.new(filepath), { acl: :authenticated_read })

      content_disposition = s3_config['content-disposition']
      if content_disposition.present?
        o.url_for(:get, expires: s3_config['url_ttl'], response_content_disposition: content_disposition).to_s
      else
        o.url_for(:get, expires: s3_config['url_ttl']).to_s
      end
    end

    private

    def filedata_from_params(filename_param, file_param, request_body, random_token)
      case
      when filename_param.present? && request_body.present?
        filedata = filename_param
      when file_param.present?
        filedata = file_param
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
          data = request_body.read.force_encoding(FILE_ENCODING)
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

  # CartoDB::FileUpload was originally designed for Rails' UploadedFile.
  # In order to avoid this need this class provides the needed interface.
  class FileUploadFile
    attr_reader :path, :original_filename, :filename, :tempfile

    def initialize(filepath)
      @path = filepath
      @original_filename = File.basename(filepath)
      @filename = @original_filename
      @tempfile = File.new(filepath)
    end
  end
end
