export const status = {
    0: {
        id: 0,
        label: 'active',
        color: 'green'
    },
    1: {
        id: 1,
        label: 'inactive',
        color: 'red'
    },
    2: {
        id: 2,
        label: 'on_vacation',
        color: 'blue'
    },
    3: {
        id: 3,
        label: 'on_leave',
        color: 'orange'
    }
} as const;

export default {
    status
}