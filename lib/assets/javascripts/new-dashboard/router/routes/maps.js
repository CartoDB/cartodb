// Hooks
import { mapsBeforeEnter, externalMapsBeforeEnter } from 'new-dashboard/router/hooks/check-navigation';
import { routesToAddMaps } from './data.js';

// Lazy Pages
const Maps = () => import('new-dashboard/pages/Maps/Maps');
const Carto = () => import('new-dashboard/pages/Maps/Carto');
const External = () => import('new-dashboard/pages/Maps/External');

const routes = [
  {
    path: '/maps/:filter?',
    component: Maps,
    meta: {
      title: () => 'Maps | CARTO'
    },
    children: [
      {
        path: '',
        name: 'maps',
        component: Carto,
        meta: {
          title: () => 'Maps | CARTO'
        },
        beforeEnter: mapsBeforeEnter,
        children: [
          ...routesToAddMaps('maps')
        ]
      },
      {
        path: 'external',
        name: 'external',
        component: External,
        meta: {
          title: () => 'Kepler.gl Maps | CARTO'
        },
        beforeEnter: externalMapsBeforeEnter
      }
    ]
  },
  {
    path: '/maps/external/:filter',
    component: Maps,
    meta: {
      title: () => 'Kepler.gl  Maps | CARTO'
    },
    children: [
      {
        path: '',
        name: 'external_filtered',
        component: External,
        meta: {
          title: () => 'Kepler.gl  Maps | CARTO'
        },
        beforeEnter: externalMapsBeforeEnter
      }
    ]
  }
];

export default routes;
