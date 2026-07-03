import { Elysia } from "elysia";
import index from ".";
import OrderItems from "../../items";
import Responses from '../../../../utils/response';

export default new Elysia({ prefix: "/items" })

// --- Create ---
.post("/", async ({ body }) => {
    try {
        const item = await OrderItems.db.getByUid(body.item_uid);
        const availableQuantity = item.detail.requested_quantity - item.detail.delivered_quantity;
        if (availableQuantity < body.quantity) {
            return Responses.service.handler.error({
                message: "Not enough quantity available",
                availableQuantity
            }, 400);
        }
        await index.db.create(body)
    } catch (error) {
        if(Responses.schema.data.check(error)) throw error;
        throw Responses.service.handler.error(error);
    }
}, index.schema.create.validation)

// --- Get by uid ---
.get("/:uid", ({ params }) => index.db.getByUid(params.uid), index.schema.get.validation)

// --- Get all ---
.get("/", ({ query }) => index.db.getAll(query), index.schema.getAll.validation)

// --- Update ---
.put("/", ({ body }) => index.db.update(body), index.schema.update.validation)