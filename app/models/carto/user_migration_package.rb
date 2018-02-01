module Carto
  class UserMigrationPackage
    private_class_method :new

    def self.for_export(id, log)
      base_dir = Cartodb.get_config(:user_migrator, 'user_exports_folder')
      instance = new(base_dir, id, log, Cartodb.get_config(:user_migrator))

      FileUtils.mkdir_p(instance.data_dir)
      FileUtils.mkdir_p(instance.meta_dir)

      instance
    end

    def self.for_import(id, log)
      base_dir = Cartodb.get_config(:user_migrator, 'user_imports_folder')
      instance = new(base_dir, id, log, Cartodb.get_config(:user_migrator))

      FileUtils.mkdir_p(instance.work_dir)

      instance
    end

    def self.for_backup(id, log)
      base_dir = Cartodb.get_config(:user_backup, 'user_exports_folder')
      config = Cartodb.get_config(:user_backup)
      instance = new(base_dir, id, log, config.merge(upload_path: 'backups'))

      FileUtils.mkdir_p(instance.data_dir)
      FileUtils.mkdir_p(instance.meta_dir)

      instance
    end

    attr_reader :data_dir, :meta_dir, :work_dir

    def initialize(base_dir, id, log, config)
      @id = id
      @log = log
      @config = config

      @base_dir = base_dir
      @work_dir = "#{base_dir}/#{id}"
      @data_dir = "#{work_dir}/data"
      @meta_dir = "#{work_dir}/meta"
    end

    def upload
      upload_package(compress)
    end

    def download(exported_file)
      uncompress(download_package(exported_file))
    end

    def cleanup
      FileUtils.remove_dir(work_dir, true)
    end

    private

    attr_reader :id, :log, :base_dir

    def compress
      filename = "user_export_#{id}.zip"

      log.append('=== Compressing export ===')
      `cd #{work_dir}/ && zip -0 -r \"../#{filename}\" . && cd -`
      FileUtils.remove_dir(work_dir)

      "#{base_dir}/#{filename}"
    end

    def upload_package(filepath)
      log.append('=== Uploading user data package ===')
      file = CartoDB::FileUploadFile.new(filepath)
      s3_config = @config['s3'] || {}
      results = file_upload_helper.upload_file_to_storage(
        file_param: file,
        s3_config: s3_config,
        allow_spaces: true,
        force_s3_upload: true,
        random_token: @config[:upload_path]
      )

      export_path = if results[:file_path].present?
                      log.append("Ad-hoc export download: #{results[:file_path]}")
                      results[:file_path]
                    else
                      log.append("By file_upload_helper: #{results[:file_uri]}")
                      results[:file_uri]
                    end

      log.append('=== Deleting tmp file ===')
      FileUtils.rm(filepath)

      export_path
    end

    def download_package(exported_file)
      destination = "#{work_dir}/export.zip"

      log.append("=== Downloading #{exported_file} to #{destination} ===")

      if exported_file.starts_with?('http')
        http_client.get_file(exported_file, destination)
      else
        FileUtils.cp(exported_file, destination)
      end

      destination
    end

    def uncompress(filename)
      log.append("=== Unzipping #{filename} ===")
      `cd #{work_dir}; unzip -u #{filename}; cd -`

      log.append('=== Deleting zip package ===')
      FileUtils.rm(filename)
    end

    def http_client
      Carto::Http::Client.get('user_imports')
    end

    def file_upload_helper
      CartoDB::FileUpload.new(@config[:uploads_path])
    end
  end
end
