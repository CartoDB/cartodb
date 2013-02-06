# encoding: utf-8
require_relative './entry'

module TrackRecord
  class Log
    include Enumerable

    def initialize
      @log = []
    end #initialize

    def append(text)
      log.push Entry.new(text)
      self
    end #append
    
    def each
      log.sort.each { |entry| yield entry }
    end #each

    def to_s
      self.map(&:to_s).join
    end #to_s

    private

    attr_reader :log
  end # Log
end # TrackRecord

