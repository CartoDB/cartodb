# encoding: utf-8
require_relative '../../services/data-repository/backend/sequel'
require_relative '../../app/models/visualization/collection'
require_relative '../../app/models/overlay/collection'
require_relative '../../app/models/synchronization/collection'

CartoDB::Visualization.repository   ||= DataRepository::Backend::Sequel.new(Rails::Sequel.connection, :visualizations)
CartoDB::Overlay.repository         ||= DataRepository::Backend::Sequel.new(Rails::Sequel.connection, :overlays)
CartoDB::Synchronization.repository ||= DataRepository::Backend::Sequel.new(Rails::Sequel.connection, :synchronizations)
