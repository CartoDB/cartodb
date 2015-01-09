# encoding: utf-8
require 'fileutils'

require_relative '../../app/helpers/file_upload_helper'

namespace :cartodb do
  desc 'Import a file to CartoDB'
  task :import, [:username, :filepath] => [:environment] do |task, args|
    user        = User.where(username: args[:username]).first
    filepath    = File.expand_path(args[:filepath])
    
    data_import = DataImport.create(
      :user_id       => user.id,
      :data_source   => filepath,
      :updated_at    => Time.now,
      :append        => false
    )
    data_import.values[:data_source] = filepath

    data_import.run_import!
    puts data_import.log
  end


  desc 'Uploads a single data import enqueued file to S3, triggering the normal flow afterwards'
  task :upload_to_s3 => [:environment] do |task, args|
    data_import_item = DataImport.where(state: DataImport::STATE_ENQUEUED)
                                 .where(upload_host: Socket.gethostname)
                                 .order(:created_at)
                                 .first

    unless data_import_item.nil?
      begin
        puts "Retrieved #{data_import_item.id}"

        data_import_item.state = DataImport::STATE_PENDING
        data_import_item.save


        filepath = data_import_item.data_source

        filename = data_import_item.data_source.slice(data_import_item.data_source.rindex('/')+1,
                                                      data_import_item.data_source.length)

        token = data_import_item.data_source.slice(/#{FileUploadHelper::UPLOADS_PATH}\/(.)+\//)
                                            .sub("#{FileUploadHelper::UPLOADS_PATH}/",'')
                                            .sub('/','')

        file_uri = FileUploadHelper.upload_file_to_s3(filepath, filename, token, Cartodb.config[:importer]['s3'])
        begin
          File.delete(filepath)
          folder = filepath.slice(0, filepath.rindex('/')).gsub('..','')
          FileUtils.rm_rf(folder) unless folder.length < FileUploadHelper::UPLOADS_PATH.length
        rescue => exception
          puts "Errored #{data_import_item.id} : #{exception}"
          CartoDB::notify_exception(exception, {
            request: 'cartodb:upload_to_s3 Rake',
            import_id: data_import_item.id
          })
        end

        data_import_item.data_source = file_uri
        data_import_item.save

        Resque.enqueue(Resque::ImporterJobs, job_id: data_import_item.id)

        puts "Uploaded #{data_import_item.id}"
      rescue => exception
        puts "Errored #{data_import_item.id} : #{exception}"

        CartoDB::notify_exception(exception, {
          request: 'cartodb:upload_to_s3 Rake',
          import_id: data_import_item.id
        })

        data_import_item.state = DataImport::STATE_FAILURE
        data_import_item.save

        File.delete(filepath)
        folder = filepath.slice(0, filepath.rindex('/')).gsub('..','')
        FileUtils.rm_rf(folder) unless folder.length < FileUploadHelper::UPLOADS_PATH.length
      end
    end
  end
end

