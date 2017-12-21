module VisualizationDestructionHelper
  def expect_visualization_to_be_destroyed(visualization)
    visualization_id = visualization.id
    map_id = visualization.map.id
    layers_ids = visualization.layers.map(&:id)
    layers_user_tables_ids = visualization.layers.flat_map(&:layers_user_tables).map(&:id)
    widgets_ids = visualization.widgets.map(&:id)
    analyses_ids = visualization.analyses.map(&:id)
    overlays_ids = visualization.overlays.map(&:id)
    permission_id = visualization.permission.id
    mapcaps_ids = visualization.mapcaps.map(&:id)
    state_id = visualization.state.id
    snapshots_ids = visualization.snapshots.map(&:id)
    synchronization_id = visualization.synchronization.try(:id)

    yield

    expect(Carto::Visualization.exists?(visualization_id)).to be_false
    expect(Carto::Map.exists?(map_id)).to be_false
    expect(Carto::Permission.exists?(permission_id)).to be_false
    expect(Carto::State.exists?(state_id)).to be_false
    expect(Carto::Synchronization.exists?(synchronization_id)).to be_false if synchronization_id
    layers_ids.each { |id| expect(Carto::Layer.exists?(id)).to be_false }
    layers_user_tables_ids.each { |id| expect(Carto::LayersUserTable.exists?(id)).to be_false }
    widgets_ids.each { |id| expect(Carto::Widget.exists?(id)).to be_false }
    analyses_ids.each { |id| expect(Carto::Analysis.exists?(id)).to be_false }
    overlays_ids.each { |id| expect(Carto::Overlay.exists?(id)).to be_false }
    mapcaps_ids.each { |id| expect(Carto::Mapcap.exists?(id)).to be_false }
    snapshots_ids.each { |id| expect(Carto::Snapshot.exists?(id)).to be_false }
  end
end
