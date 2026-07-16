import Schema from './schema'
import database from '../../database'
import storage from '../../storage'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { ProductType, ProductCreateBodyType, ProductUpdateBodyType } from './type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';
import { buildDataGridSQLiteConditions } from '../../utils/devextreme/datagrid/service';

export default {
    async create(input: ProductCreateBodyType): Promise<SuccessServiceResponse<{ uid: string }>> {
        try {
            const result = await database
                .prepare("INSERT INTO products (name, price, description) VALUES (?, ?, ?) RETURNING uid")
                .bind(input.name, input.price, input.description || null)
                .first<{ uid: string }>();
            return Responses.service.handler.success(result!);
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async getByUid(uid: ProductType["uid"]): Promise<SuccessServiceResponse<ProductType>> {
        try {
            const result = await database.prepare(`
                SELECT * FROM products
                WHERE uid = ?
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Product not found", 404);
            return Responses.service.handler.success(result as ProductType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getAll(inputs: DataGridQuery): Promise<SuccessServiceResponse<DataGridResponse<ProductType>>> {
        try {
            const tableName = "products";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);

            const from = `FROM ${ tableName }`;

            const query: string[] = [`SELECT * ${ from }`];
            let orderBy: string;
            let result;

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    name: { searchText: 'name', values: 'name' },
                    description: { searchText: 'description', values: 'description' },
                    price: { searchText: 'price', values: 'price' },
                    quantity: { searchText: 'quantity', values: 'quantity' },
                    created_at: { searchText: 'created_at', values: 'created_at' }
                }
            });

            query.push(...conditions);

            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                orderBy = `ORDER BY ${ selector } ${ desc ? "DESC" : "ASC" }`;
                query.push(orderBy);
            }

            query.push(limit);
            query.push(offset);

            const prepare = database.prepare(query.join(" "));
            result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = ["SELECT COUNT(*) as count", from, ...conditions].join(" ");
                const prepareCount = database.prepare(countQuery);
                countResult = binds.length ? await prepareCount.bind(...binds).first() as { count: number } : await prepareCount.first() as { count: number };
            }

            return Responses.service.handler.success({
                data: result.results as ProductType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<ProductType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(body: ProductUpdateBodyType) {
        try {
            const result = await database.prepare(`
                UPDATE products
                SET name = ?, price = ?, description = ?
                WHERE uid = ?
            `).bind(body.name, body.price, body.description, body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getImages(uid: ProductType["uid"]): Promise<SuccessServiceResponse<R2Object[]>> {
        try {
            // `include` is required for R2 list() to return customMetadata (original file name)
            const { objects } = await storage.list({ prefix: `products/${ uid }/`, include: ["customMetadata", "httpMetadata"] });
            return Responses.service.handler.success(objects);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async uploadImage({ uid, file, primary }: { uid: ProductType["uid"]; file: File; primary?: boolean }): Promise<SuccessServiceResponse<{ image: string }>> {
        try {
            const extension = file.name.split(".").pop() || "bin";
            const key = `products/${ uid }/${ crypto.randomUUID() }.${ extension }`;
            await storage.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type }, customMetadata: { fileName: file.name } });

            // First image or explicit request => make it the primary
            if (primary) await database.prepare("UPDATE products SET image = ? WHERE uid = ?").bind(key, uid).run();

            return Responses.service.handler.success({ image: key });
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async setPrimary({ uid, image }: { uid: ProductType["uid"]; image: string }): Promise<SuccessServiceResponse<undefined>> {
        try {
            if (!image.startsWith(`products/${ uid }/`)) throw Responses.service.handler.error("Image does not belong to this product", 400);
            await database.prepare("UPDATE products SET image = ? WHERE uid = ?").bind(image, uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async deleteImage({ uid, image }: { uid: ProductType["uid"]; image: string }): Promise<SuccessServiceResponse<undefined>> {
        try {
            if (!image.startsWith(`products/${ uid }/`)) throw Responses.service.handler.error("Image does not belong to this product", 400);

            await storage.delete(image);

            const product = await database.prepare("SELECT image FROM products WHERE uid = ?").bind(uid).first<{ image: string }>();
            if (product && product.image === image) {
                // Deleted the primary: promote the newest remaining image, or clear it
                // const { objects } = await storage.list({ prefix: `products/${ uid }/` });
                // const next = objects.sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime())[0];
                await database.prepare("UPDATE products SET image = ? WHERE uid = ?").bind("", uid).run();
            }

            return Responses.service.handler.success();
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}
