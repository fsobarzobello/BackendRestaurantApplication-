export default {
    routes: [
      {
        method: "GET",
        path: "/orders",
        handler: "order.find", // Ensure `find` is defined in the controller
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: "POST",
        path: "/orders",
        handler: "order.create", // Ensure `create` is defined in the controller
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: "GET",
        path: "/orders/:id",
        handler: "order.findOne", // Ensure `findOne` is defined in the controller
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: "GET",
        path: "/orders/by-user/:username",
        handler: "order.findByUser",
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };
  