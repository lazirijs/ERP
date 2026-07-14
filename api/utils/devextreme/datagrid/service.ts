import type { DataGridQuery } from "./type";

/**
 * Maps a DevExtreme column `dataField` to the SQL column it should filter on.
 * Acts as a whitelist: any field that is not present here is ignored, so raw
 * client-supplied field names never reach the SQL string.
 *
 * Note: header-filter `values` carry the column's `valueExpr` (e.g. project
 * uids), so lookup-style columns should map their display field to the
 * corresponding `*_uid` column (e.g. `'project.name' -> 't.project_uid'`).
 */

export type FilterColumnMap = Record<string, {
    searchText?: string; 
    values?: string; 
}>;

export interface DataGridSQLiteConditions {
    conditions: string[];
    binds: unknown[];
}

export interface BuildConditionsParams {
    searchText: DataGridQuery["searchText"];
    filters: DataGridQuery["filters"];
    columns: FilterColumnMap;
    excludeColumnsFromSearchText?: string[];
}

/**
 * Builds parameterized SQLite conditions from DevExtreme DataGrid filters.
 *
 * Two filter mechanisms are supported per column:
 *  - `values`  -> header filter multi-select, rendered as `IN` / `NOT IN`
 *                 (`type: 'exclude'` flips it to `NOT IN`).
 *  - `searchText` + `operation` -> filter row, rendered per operation
 *                 (LIKE for text operations, comparisons, and `between`).
 *
 * Both can be present on the same column and are ANDed together. Column names
 * come exclusively from `columnMap`; only bound values come from the client.
 */

export function searchTextBuilder(value: DataGridQuery["searchText"], columns: string[]): DataGridSQLiteConditions {
    const conditions: string[] = [];
    const binds: unknown[] = [];
    
    if (value) {
        value = `%${ value }%`;
        conditions.push(`(${ columns.map(column => `${ column } LIKE ?`).join(" OR ") })`);
        binds.push(...columns.map(() => value));
    }
    
    return { conditions, binds };
}

export function filtersBuilder(filters: DataGridQuery["filters"], columns: FilterColumnMap): DataGridSQLiteConditions {
    let conditions: string[] = [];
    const binds: unknown[] = [];

    if (!filters?.length) return { conditions, binds };

    filters.forEach(filter => {
        const column = columns[filter.field];
        if (column) {
            // Header filter (checkbox multi-select) -> IN / NOT IN
            if (filter.values?.length) {
                const placeholders = filter.values.map((value) => value !== null ? "?" : "").filter(Boolean).join(", ");
                const condition: string[] = [];
                if (placeholders.length) condition.push(`${ column.values } ${ filter.type === "exclude" ? "NOT IN" : "IN" } (${ placeholders })`);
                if (filter.values.some(value => value === null)) condition.push(`${ column.values } ${ filter.type === "exclude" ? "IS NOT" : "IS" } NULL`);
                conditions.push(condition.join(" OR "));
                binds.push(...filter.values.filter(value => value !== null));
            }
    
            // Filter row (single value + operation)
            if (filter.searchText !== undefined && filter.searchText !== null && filter.searchText !== "") {
                const operation = filter.operation ?? "contains";

                switch (operation) {
                    case "contains":
                        conditions.push(`${ column.searchText } LIKE ?`);
                        binds.push(`%${ filter.searchText }%`);
                        break;
                    case "notcontains":
                        conditions.push(`${ column.searchText } NOT LIKE ?`);
                        binds.push(`%${ filter.searchText }%`);
                        break;
                    case "startswith":
                        conditions.push(`${ column.searchText } LIKE ?`);
                        binds.push(`${ filter.searchText }%`);
                        break;
                    case "endswith":
                        conditions.push(`${ column.searchText } LIKE ?`);
                        binds.push(`%${ filter.searchText }`);
                        break;
                    case "between": {
                        const [from, to] = Array.isArray(filter.searchText) ? filter.searchText : [filter.searchText, null];
                        if (from !== undefined && from !== null) {
                            conditions.push(`${ column.searchText } >= ?`);
                            binds.push(from);
                        }
                        if (to !== undefined && to !== null) {
                            conditions.push(`${ column.searchText } <= ?`);
                            binds.push(to);
                        }
                        break;
                    }
                    default: // '=', '<>', '<', '>', '<=', '>=' (all valid SQLite operators)
                        conditions.push(`${ column.searchText } ${ operation } ?`);
                        binds.push(filter.searchText);
                        break;
                }
            }
        }
    });

    if (conditions.length) conditions = conditions.flatMap((item, index) =>
        index === conditions.length - 1 ? [item] : [item, "AND"]
    );

    return { conditions, binds };
}

export function buildDataGridSQLiteConditions({ filters, columns, searchText, excludeColumnsFromSearchText }: BuildConditionsParams): DataGridSQLiteConditions {
    const filterConditions = filtersBuilder(filters, columns);
    excludeColumnsFromSearchText?.forEach(column => delete columns[column.replaceAll('"', '')]);
    const searchTextConditions = searchTextBuilder(searchText, Object.values(columns).map(column => column.searchText).filter(Boolean) as string[]);
    
    if (searchTextConditions.conditions.length) {
        searchTextConditions.conditions.unshift("WHERE");
        if (filterConditions.conditions.length) filterConditions.conditions.unshift("AND");
    }
    else if (filterConditions.conditions.length) filterConditions.conditions.unshift("WHERE");

    return {
        conditions: [...searchTextConditions.conditions, ...filterConditions.conditions],
        binds: [...searchTextConditions.binds, ...filterConditions.binds]
    };
}

export default { filtersBuilder, searchTextBuilder, buildDataGridSQLiteConditions };
