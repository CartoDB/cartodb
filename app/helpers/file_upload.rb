# coding: utf-8

require 'aws-sdk-s3'

module CartoDB
  class FileUpload

    DEFAULT_UPLOADS_PATH = 'public/uploads'
    FILE_ENCODING = 'utf-8'
    MAX_SYNC_UPLOAD_S3_FILE_SIZE = 52428800 # bytes

    def initialize(uploads_path = nil)
      @uploads_path = uploads_path || DEFAULT_UPLOADS_PATH
      @uploads_path = if @uploads_path[0] == "/"
                        Pathname.new(@uploads_path)
                      else
                        Rails.root.join(@uploads_path)
                      end
    end

    def get_uploads_path
      @uploads_path
    end

    # force_s3_upload uploads file to S3 even if size is greater than `MAX_SYNC_UPLOAD_S3_FILE_SIZE`
    def upload_file_to_storage(filename_param: nil,
                               file_param: nil,
                               request_body: nil,
                               s3_config: nil,
                               timestamp: Time.now,
                               allow_spaces: false,
                               force_s3_upload: false,
                               random_token: nil)
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

      filename = filename.tr(' ', '_') unless allow_spaces

      random_token ||= Digest::SHA2.hexdigest("#{timestamp.utc}--#{filename.object_id}").first(20)

      use_s3 = !s3_config.nil? && s3_config['access_key_id'].present? && s3_config['secret_access_key'].present? &&
               s3_config['bucket_name'].present? && s3_config['url_ttl'].present?

      file = nil
      if load_file_from_request_body
        file = filedata_from_params(filename_param, file_param, request_body, random_token, filename)
        filepath = file.path
      end

      do_long_upload = s3_config && s3_config['async_long_uploads'].present? && s3_config['async_long_uploads'] &&
        File.size(filepath) > MAX_SYNC_UPLOAD_S3_FILE_SIZE

      if use_s3 && (!do_long_upload || force_s3_upload)
        file_url = upload_file_to_s3(filepath, filename, random_token, s3_config)

        if load_file_from_request_body
          File.delete(file.path)
        end

        results[:file_uri] = file_url
      else
        unless load_file_from_request_body
          file = filedata_from_params(filename_param, file_param, request_body, random_token, filename)
        end

        results[:file_path] = file.path

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
      s3_config_hash = {
        access_key_id: s3_config['access_key_id'],
        secret_access_key: s3_config['secret_access_key'],
        http_proxy: s3_config['proxy_uri'].present? ? s3_config['proxy_uri'] : nil,
        region: s3_config['region']
      }
      # This allows to override the S3 endpoint in case a non AWS compatible
      # S3 storage service is being used
      # WARNING: This attribute may not work in some aws-sdk v1 versions newer
      # than 1.8.5 (http://lists.basho.com/pipermail/riak-users_lists.basho.com/2013-May/011984.html)
      s3_config_hash[:endpoint] = s3_config['s3_endpoint'] if s3_config['s3_endpoint'].present?
      Aws.config = s3_config_hash

      s3 = Aws::S3::Resource.new
      obj = s3.bucket(s3_config['bucket_name']).object("#{token}/#{File.basename(filename)}")

      obj.upload_file(filepath, acl: 'authenticated-read')

      options = { expires_in: s3_config['url_ttl'] }
      content_disposition = s3_config['content-disposition']
      options[:response_content_disposition] = content_disposition if content_disposition.present?
      obj.presigned_url(:get, options)
    end

    private

    def filedata_from_params(filename_param, file_param, request_body, random_token, filename)
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
