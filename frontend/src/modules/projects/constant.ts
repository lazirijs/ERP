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
    },
    4: {
        id: 4,
        label: 'on_hold',
        color: 'orange'
    },
    5: {
        id: 5,
        label: 'cancelled',
        color: 'red'
    }
} as const;

export default {
    status
}