import { factories } from "@strapi/strapi";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default factories.createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    try {
      const { address, amount, dishes, token, city, state } = ctx.request.body;

      console.log("Received data:", { address, amount, token, city, state });

      const stripeAmount = Math.round(amount);

      if (!token) {
        ctx.throw(400, "Payment token is required.");
      }

      // Validar la existencia de los dishes en la base de datos
      const dishDocumentIds = dishes.map((dish) => dish.id);

      const validDishes = await strapi.documents("api::dish.dish").findMany({
        filters: { documentId: { $in: dishDocumentIds } },
      });

      console.log("Found valid dishes:", validDishes);

      const validDishDocumentIds = validDishes.map((dish) => dish.documentId);
      const invalidDishDocumentIds = dishDocumentIds.filter(
        (id) => !validDishDocumentIds.includes(id)
      );

      if (invalidDishDocumentIds.length > 0) {
        console.error(
          `Invalid dish IDs: ${invalidDishDocumentIds.join(", ")}`
        );
        ctx.throw(
          400,
          `The following dish IDs do not exist: ${invalidDishDocumentIds.join(
            ", "
          )}`
        );
      }

      const charge = await stripe.charges.create({
        amount: stripeAmount,
        currency: "usd",
        description: `Order ${new Date()} by ${
          ctx.state.user ? ctx.state.user.id : "guest"
        }`,
        source: token,
        metadata: {
          dishes: JSON.stringify(dishes),
        },
      });

      console.log("Stripe charge successful:", charge);

      // Crear la orden en la base de datos con populate
      const order = await strapi.documents("api::order.order").create({
        data: {
          charge_id: charge.id,
          token,
          address,
          amount: stripeAmount,
          city,
          state,
          dishes: validDishDocumentIds, // Relacionar los IDs válidos
          users_permissions_user: ctx.state.user?.id,
        },
        populate: ["users_permissions_user"], // Incluye la relación de usuario
      });

      console.log("Order saved in database:", order);

      return order;
    } catch (error) {
      console.error("Error processing order:", error);

      if (error.type === "StripeCardError") {
        ctx.throw(400, "Payment failed: " + error.message);
      }

      ctx.throw(500, "An error occurred while processing the payment.");
    }
  },

  async find(ctx) {
    // Agregar populate al método `find` para incluir siempre la relación del usuario
    ctx.query = {
      ...ctx.query,
      populate: "*", // Populate todas las relaciones en un nivel de profundidad
    };

    const orders = await strapi.documents("api::order.order").findMany(ctx.query);

    // Devuelve directamente los documentos
    return orders;
  },

  async findOne(ctx) {
    // Agregar populate al método `findOne` para incluir siempre la relación del usuario
    const { id } = ctx.params;

    const order = await strapi.documents("api::order.order").findOne({
      documentId: id,
      populate: {
        users_permissions_user: { fields: ["username", "email"] }, // Personaliza los campos poblados
      },
    });

    if (!order) {
      return ctx.notFound("Order not found");
    }

    // Devuelve directamente el documento
    return order;
  },

  async findByUser(ctx) {
    try {
      const { username } = ctx.params;

      if (!username) {
        return ctx.badRequest("Username is required");
      }

      // Buscar el usuario con el username
      const user = await strapi.documents("plugin::users-permissions.user").findFirst({
        filters: { username: { $eq: username } },
        fields: ["id", "username", "email"],
      });

      if (!user) {
        return ctx.notFound("User not found");
      }

      // Buscar las órdenes relacionadas con el usuario
      const orders = await strapi.documents("api::order.order").findMany({
        filters: { users_permissions_user: { id: user.id } },
        populate: ["users_permissions_user"],
      });

      return ctx.send({ data: orders });
    } catch (error) {
      console.error("Error fetching orders by user:", error);
      return ctx.internalServerError("Failed to fetch orders");
    }
  },
}));
