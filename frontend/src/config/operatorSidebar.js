import { Activity, Clock, Settings, HardHat } from 'lucide-react';

export const operatorSidebarItems = [
    { 
        id: 'live', 
        label: 'Live Monitoring', 
        icon: Activity, 
        path: '/operator-dashboard',
        isActive: true
    },
    { 
        id: 'queue', 
        label: 'Booking Queue', 
        icon: Clock, 
        path: '/operator-dashboard/queue' // For now let's just use tabs inside the main page
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
