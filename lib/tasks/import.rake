require 'fileutils'
require_relative '../../app/helpers/file_upload'

namespace :cartodb do
  desc 'Import a file to CartoDB. "times" parameter is there for load test purposes. Defaults to 1.'
  task :import, [:username, :filepath, :times] => [:environment] do |_task, args|
    times = (args[:times] || 1).to_i
    user        = ::User.where(username: args[:username]).first
    filepath    = File.expand_path(args[:filepath])

    data_import = DataImport.create(
      :user_id       => user.id,
      :data_source   => filepath,
      :updated_at    => Time.now,
      :append        => false
    )
    data_import.values[:data_source] = filepath

    (1..times).each do
      data_import.run_import!
      puts data_import.log
    end
  end


  desc 'Uploads a single data import enqueued file to S3, triggering the normal flow afterwards'
  task upload_to_s3: [:environment] do
    data_import_item = DataImport.where(state: DataImport::STATE_ENQUEUED)
                                 .where(upload_host: Socket.gethostname)
                                 .order(:created_at)
                                 .first

    file_upload_helper = CartoDB::FileUpload.new(Cartodb.get_config(:importer, 'uploads_path'))

    unless data_import_item.nil?
      # be 100% safe in rescue blocks when trying to log the failed id
      data_import_item_id = data_import_item.id rescue nil

      begin
        puts "Retrieved #{data_import_item.id}"

        data_import_item.state = DataImport::STATE_PENDING
        data_import_item.save

        filepath = File.realpath data_import_item.data_source
        filename = File.basename data_import_item.data_source

        uploads_path = File.realpath file_upload_helper.get_uploads_path

        # Files are temp stored in "/%{uploads_path}/token/basename.ext"
        token = File.basename File.dirname filepath

        file_uri = file_upload_helper.upload_file_to_s3(filepath, filename, token, Cartodb.get_config(:importer, 's3'))
        begin
          File.delete(filepath)
          folder = filepath.slice(0, filepath.rindex('/')).gsub('..', '')
          FileUtils.rm_rf(folder) unless folder.length < uploads_path.to_s.length
        rescue StandardError => exception
          puts "Errored #{data_import_item_id} : #{exception}"
          CartoDB::notify_error(
            exception,
            task: 'cartodb:upload_to_s3 Rake',
            import_id: data_import_item_id,
            item: data_import_item.inspect
          )
        end

        data_import_item.data_source = file_uri
        data_import_item.save

        Resque.enqueue(Resque::ImporterJobs, job_id: data_import_item.id)

        puts "Uploaded #{data_import_item.id}"
      rescue StandardError => exception
        puts "Errored #{data_import_item_id} : #{exception}"

        CartoDB::notify_error(
          exception,
          task: 'cartodb:upload_to_s3 Rake',
          import_id: data_import_item_id,
          item: data_import_item.inspect
        )

        data_import_item.state = DataImport::STATE_FAILURE
        data_import_item.save

        File.delete(filepath)
        folder = filepath.slice(0, filepath.rindex('/')).gsub('..', '')
        FileUtils.rm_rf(folder) unless folder.length < file_upload_helper.get_uploads_path.to_s.length
      end
    end
  end
end
