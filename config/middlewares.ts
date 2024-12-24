export default ({ env }) => [
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://felipe-sobarzo-full-stack-res-a3332bfb2e0d.herokuapp.com', // Frontend en producción
        'http://localhost:3000', // Para desarrollo local
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
    },
  },
  'strapi::security',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
