# encoding: utf-8
require 'ostruct'
require 'set'
require_relative '../repository'

module DataRepository
  class Collection
    include Enumerable

    INTERFACE  = %w{ signature add delete store fetch each to_json repository
    count } + Enumerable.instance_methods

    attr_reader   :signature
    attr_accessor :storage

    def initialize(arguments={})
      @storage      = Set.new
      @member_class = arguments.fetch(:member_class, OpenStruct)
      @repository   = arguments.fetch(:repository, Repository.new)
      @signature    = arguments.fetch(:signature, @repository.next_id)
    end #initialize

    def add(member)
      storage.add(member.id)
      self
    end #add

    def delete(member)
      storage.delete(member.id)
      self
    end #delete

    def each(&block)
      return members(&block) if block
      Enumerator.new(self, :each)
    end #each

    def fetch
      self.storage = Set[*repository.fetch(signature)]
      self
    rescue => exception
      storage.clear
      self
    end #fetch

    def store
      repository.store(signature, storage.to_a)
      self
    end #store

    def to_json(*args)
      map { |member| member.fetch.to_hash }.to_json(*args)
    end #to_json

    def count
      return 0 unless repository.respond_to?(:count)
      repository.count
    end #count

    private

    attr_reader   :repository, :member_class

    def members
      storage.each { |member_id| yield member_class.new(id: member_id).fetch }
    end #members
  end # Collection
end # DataRepository

