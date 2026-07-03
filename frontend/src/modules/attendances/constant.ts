export const status = {
    0: {
        id: 0,
        label: 'present',
        color: 'green'
    },
    1: {
        id: 1,
        label: 'absent',
        color: 'red'
    }
} as const;

export default {
    status
}