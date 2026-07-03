export const status = {
    0: {
        id: 0,
        label: 'planning',
        color: 'yellow'
    },
    1: {
        id: 1,
        label: 'closed',
        color: 'gray'
    },
    2: {
        id: 2,
        label: 'active',
        color: 'green'
    },
    3: {
        id: 3,
        label: 'completed',
        color: 'blue'
    }
} as const;

export default {
    status
}