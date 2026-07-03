export const type = {
    "+": {
        id: "+",
        label: 'payout',
        color: 'green'
    },
    "-": {
        id: "-",
        label: 'expense',
        color: 'red'
    }
} as const;

export default {
    type
}