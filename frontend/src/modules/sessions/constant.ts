import { supportedBadgeColors } from '@/constants';

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
} as const satisfies Record<number, {
    id: number;
    label: string;
    color: (typeof supportedBadgeColors)[number];
}>;

export default {
    status
}
