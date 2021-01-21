// Pages
const TilesetsViewerPage = () => import('new-dashboard/pages/TilesetsViewer');

const routes = [
  {
    path: '/tilesets/:id',
    name: 'tileset-viewer',
    component: TilesetsViewerPage,
    meta: {
      title: () => 'Tilesets viewer | CARTO'
    }
  }
];

export default routes;
