# encoding: utf-8
require_relative '../../services/data-repository/repository'

module CartoDB
  module Visualization
    def self.repository=(repository)
      @repository = repository
    end # self.repository

    def self.repository
      @repository ||= DataRepository::Repository.new
    end #self.repository
  end # Visualization
end # CartoDB

