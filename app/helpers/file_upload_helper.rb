# coding: utf-8

module  FileUploadHelper

    UPLOADS_PATH  = 'public/uploads'
    FILE_ENCODING = 'utf-8'

    def upload_file_to_storage(params, request)
      results = {
        file_uri: nil,
        enqueue:  true
      }

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

      random_token = Digest::SHA2.hexdigest("#{Time.now.utc}--#{filename.object_id.to_s}").first(20)

      s3_config = Cartodb.config[:importer]['s3']
      file = nil
      if ajax_upload
        file = save_body_to_file(params, request, random_token, filename)
        filepath = file.path
      end

      if s3_config && s3_config['access_key_id'] && s3_config['secret_access_key']
        AWS.config(
          access_key_id: Cartodb.config[:importer]['s3']['access_key_id'],
          secret_access_key: Cartodb.config[:importer]['s3']['secret_access_key']
        )
        s3 = AWS::S3.new
        s3_bucket = s3.buckets[s3_config['bucket_name']]

        path = "#{random_token}/#{File.basename(filename)}"
        o = s3_bucket.objects[path]

        o.write(Pathname.new(filepath), { acl: :authenticated_read })

        file_url = o.url_for(:get, expires: s3_config['url_ttl']).to_s

        if ajax_upload
          File.delete(file.path)
        end

        results[:file_uri] = file_url
      else
        unless ajax_upload
          file = save_body_to_file(params, request, random_token, filename)
        end
        results[:file_uri] = file.path[/(\/uploads\/.*)/, 1]
      end
      results
    end


    def save_body_to_file(params, request, random_token, filename)
      case
        when params[:filename].present? && request.body.present?
          filedata =
            params[:filename].read.force_encoding(FILE_ENCODING) rescue request.body.read.force_encoding(FILE_ENCODING)
        when params[:file].present?
          filedata = params[:file].read.force_encoding(FILE_ENCODING)
        else
          return
      end

      FileUtils.mkdir_p(Rails.root.join(UPLOADS_PATH).join(random_token))

      file = File.new(Rails.root.join(UPLOADS_PATH).join(random_token).join(File.basename(filename)), 'w')
      file.write filedata
      file.close
      # Force GC pass to avoid stale memory (dev installations Ruby issue)
      filedata = nil
      file
    end

end
