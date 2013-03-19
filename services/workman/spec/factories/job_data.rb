# encoding: utf-8
require 'uuidtools'

module Workman
  class Factory
    def self.job_data(arguments={})
      {
        id:         arguments.fetch(:id, random_uuid),
        command:    arguments.fetch(:command, random_string),
        arguments:  arguments.fetch(:arguments, { database: random_string })
      }
    end # self.job_data

    private

    def self.random_uuid
      UUIDTools::UUID.timestamp_create.to_s
    end #random_uuid

    def self.random_string
      (0...50).map{ ('a'..'z').to_a[rand(26)] }.join
    end # self:random_string
  end # Factory
end # Workman

