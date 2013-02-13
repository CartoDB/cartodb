#!/usr/bin/env ruby
# encoding: utf-8
require 'open3'
require_relative './s3_uploader'

module Workman
  module Commands
    class PostgresDumper
      EXECUTABLE = 'pg_dump'
      
      def initialize(database, user=nil, password=nil)
        @database = database
        @user     = user
        @password = password
      end #initialize

      def run(dump_repository=:s3)
        dump
        upload_to(dump_repository)
      end #run

      def dump
        create_dumps_dir_if_nonexistent
        @stdout, @stderr, @status = Open3.capture3(dump_command)
        raise unless @status.success?
        self
      end #dump

      def upload_to(dump_repository)
        dump_url_or_path = send "#{dump_repository}_upload"
      end #upload_to

      def dump_filepath
        File.join(dumps_dir, dump_filename)
      end #dumdp_filepath

      private

      attr_reader :database, :user, :password

      def create_dumps_dir_if_nonexistent
        Dir.mkdir(dumps_dir) unless Dir.exists?(dumps_dir)
      end #create_dumps_dir_if_nonexistent

      def dumps_dir
        File.join('/', 'var', 'tmp', 'workman')
      end #dumps_dir

      def dump_filename
        "#{database}_#{dump_id}.dump"
      end #dump_filename

      def dump_id
        @dump_id ||= Time.now.utc.to_f
      end #dump_id

      def user_option
        "-U #{user}" if user
      end #user_option

      def password_option
        "-W #{password}" if password
      end #password_option

      def dump_command
        "#{EXECUTABLE} #{dump_options} > #{dump_filepath}"
      end #dump_command

      def dump_options
        [database, user_option, password_option].join(' ')
      end #dump_options

      def local_upload
        uploaded_file_path = "/var/tmp/dumps/#{dump_filename}"
        `mv #{dump_filepath} #{uploaded_file_path}` 
        uploaded_file_path
      end #local_upload

      def s3_upload
        S3Uploader.new.upload(dump_filepath).to_s
      end #s3_upload
    end # PostgresDump
  end # Commands
end # Workman

