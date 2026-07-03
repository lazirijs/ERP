export const status = {
    0: {
        id: 0,
        label: 'draft',
        color: 'gray'
    },
    1: {
        id: 1,
        label: 'completed',
        color: 'green'
    }
} as const;

export default {
    status
}