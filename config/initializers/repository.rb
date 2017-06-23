# encoding: utf-8
require_relative '../../services/data-repository/backend/sequel'
require_relative '../../app/models/visualization/collection'
require_relative '../../app/models/synchronization/collection'

CartoDB::Visualization.repository   ||= DataRepository::Backend::Sequel.new(SequelRails.connection, :visualizations)
CartoDB::Synchronization.repository ||= DataRepository::Backend::Sequel.new(SequelRails.connection, :synchronizations)
