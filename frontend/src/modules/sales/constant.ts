import { supportedBadgeColors } from '@/constants';

export const status = {
    0: {
        id: 0,
        label: 'pending',
        color: 'yellow'
    },
    1: {
        id: 1,
        label: 'completed',
        color: 'green'
    }
} as const satisfies Record<number, {
    id: number;
    label: string;
    color: (typeof supportedBadgeColors)[number];
}>;

export default {
    status
}
