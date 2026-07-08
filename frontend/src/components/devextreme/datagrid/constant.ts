import type { DevExtremeDataGridRemoteQuery } from "./type";

export const defaultQuery: DevExtremeDataGridRemoteQuery = {
    searchText: '',
    requireTotalCount: false,
    sort: [{ selector: 'created_at', desc: true }],
    skip: 0,
    take: 20
};

export default { defaultQuery };