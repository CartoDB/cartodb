# encoding: utf-8
require_relative '../../services/data-repository/repository'

module CartoDB
  module Visualization
    def self.default_repository=(repository)
      @repository = repository
    end # self.default_repository

    def self.default_repository
      @repository ||= DataRepository::Repository.new
    end #self.default_repository
  end # Visualization
end # CartoDB

