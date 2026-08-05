import { supportedBadgeColors } from '@/constants';

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
} as const satisfies Record<number, {
    id: number;
    label: string;
    color: (typeof supportedBadgeColors)[number];
}>;

export default {
    status
}
