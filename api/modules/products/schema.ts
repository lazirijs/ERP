import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String({ minLength: 1, maxLength: 50 }),
    price: t.Number({ minimum: 0 }),
    description: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ]))
});

const product = t.Object({
    uid: t.String(),
    ...createBody.properties,
    image: t.Optional(t.String({ default: "" })),
    quantity: t.Number(),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: product.properties.uid
});

const updateBody = t.Object({
    uid: product.properties.uid,
    name: product.properties.name,
    price: product.properties.price,
    description: product.properties.description
});

const uploadImageBody = t.Object({
    file: t.File({
        type: "image/*",
        maxSize: "5m"
    })
});

const uploadImageQuery = t.Object({
    primary: t.Optional(t.Boolean())
});

const imageKeyBody = t.Object({
    image: t.String()
});

export default {
    data: {
        value: product,
    },
    create: {
        validation: {
            auth: true,
            body: createBody
        }
    },
    get: {
        validation: {
            auth: true,
            params: getParams
        }
    },
    getAll: {
        validation: {
            auth: true,
            query: DataGridSchema.data
        }
    },
    update: {
        validation: {
            auth: true,
            body: updateBody
        }
    },
    getImages: {
        validation: {
            auth: true,
            params: getParams
        }
    },
    uploadImage: {
        validation: {
            auth: true,
            params: getParams,
            query: uploadImageQuery,
            body: uploadImageBody
        }
    },
    setPrimary: {
        validation: {
            auth: true,
            params: getParams,
            body: imageKeyBody
        }
    },
    deleteImage: {
        validation: {
            auth: true,
            params: getParams,
            body: imageKeyBody
        }
    }
};
