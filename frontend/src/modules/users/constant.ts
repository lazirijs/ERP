export const status = {
    0: {
        id: 0,
        label: 'inactive',
        color: 'gray'
    },
    1: {
        id: 1,
        label: 'active',
        color: 'green'
    },
    2: {
        id: 2,
        label: 'suspended',
        color: 'red'
    }
} as const;

export default {
    status
}
