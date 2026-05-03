import { LayoutDashboard, Shield, MapPin } from 'lucide-react';

export const adminSidebarItems = [
    {
        label: 'Overview',
        icon: LayoutDashboard,
        path: '/admin',
    },
    {
        label: 'Station Requests',
        icon: Shield,
        path: '/admin/station-requests',
    },
    {
        label: 'Stations Management',
        icon: MapPin,
        path: '/admin/stations',
    },
];
