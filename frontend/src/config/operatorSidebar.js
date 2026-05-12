import { Activity, Clock, Settings, HardHat, Layout } from 'lucide-react';

export const operatorSidebarItems = [
    { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: Layout, 
        path: '/operator-dashboard',
        isActive: true
    },
    { 
        id: 'queue', 
        label: 'Bookings', 
        icon: Clock, 
        path: '/operator/bookings' // For now let's just use tabs inside the main page
    },
    { 
        id: 'maintenance', 
        label: 'Maintenance', 
        icon: Settings, 
        path: '/operator-dashboard/maintenance' 
    },
    { 
        id: 'support', 
        label: 'Help Desk', 
        icon: HardHat, 
        path: '/operator-dashboard/support' 
    },
];
