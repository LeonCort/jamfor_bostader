"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Bus, Footprints, AlertTriangle } from 'lucide-react';
interface RouteStep {
  id: string;
  type: 'walk' | 'bus' | 'train' | 'drive';
  instruction: string;
  duration: string;
  distance?: string;
  line?: string;
  stops?: number;
  departureTime?: string;
  arrivalTime?: string;
}
interface RouteOption {
  id: string;
  mode: 'car' | 'transit' | 'walking' | 'biking';
  duration: string;
  distance: string;
  description: string;
  departureTime?: string;
  arrivalTime?: string;
  steps: RouteStep[];
  hasAlert?: boolean;
  walkingTime?: string;
  departureLocation?: string;
}
interface RouteOptionsListProps {
  routes: RouteOption[];
  selectedRoute: string;
  onRouteSelect: (routeId: string) => void;
}
const ROUTE_OPTIONS: RouteOption[] = [{
  id: '1',
  mode: 'transit',
  duration: '1 tim 51 min',
  distance: '11.2 km',
  description: 'via Route 118 and 919',
  departureTime: '07:12',
  arrivalTime: '09:03',
  walkingTime: '33 min',
  departureLocation: 'Norrhagen',
  steps: []
}, {
  id: '2',
  mode: 'transit',
  duration: '1 tim 49 min',
  distance: '10.8 km',
  description: 'via Route 886 and SJ InterCity',
  departureTime: '06:54',
  arrivalTime: '08:43',
  steps: []
}, {
  id: '3',
  mode: 'transit',
  duration: '1 tim 50 min',
  distance: '11.5 km',
  description: 'via Route 805 and 817',
  departureTime: '06:46',
  arrivalTime: '08:36',
  steps: []
}, {
  id: '4',
  mode: 'transit',
  duration: '1 tim 42 min',
  distance: '10.2 km',
  description: 'via Route 886 and 817',
  departureTime: '06:54',
  arrivalTime: '08:36',
  steps: []
}, {
  id: '5',
  mode: 'transit',
  duration: '1 tim 56 min',
  distance: '12.1 km',
  description: 'via Route 118 and 40',
  departureTime: '06:39',
  arrivalTime: '08:35',
  hasAlert: true,
  steps: []
}, {
  id: '6',
  mode: 'transit',
  duration: '1 tim 40 min',
  distance: '9.8 km',
  description: 'via Route 886 and 915',
  departureTime: '06:22',
  arrivalTime: '08:02',
  steps: []
}];

// @component: RouteOptionsList
export const RouteOptionsList = ({
  routes = ROUTE_OPTIONS,
  selectedRoute,
  onRouteSelect
}: RouteOptionsListProps) => {
  const getTransportIcons = (description: string): string[] => {
    const icons: string[] = [];
    if (description.includes('118')) icons.push('118');
    if (description.includes('886')) icons.push('886');
    if (description.includes('805')) icons.push('805');
    if (description.includes('817')) icons.push('817');
    if (description.includes('919')) icons.push('919');
    if (description.includes('915')) icons.push('915');
    if (description.includes('40')) icons.push('40');
    if (description.includes('SJ InterCity')) icons.push('SJ InterCity');
    return icons;
  };

  // @return
  return <div className="p-4 space-y-3">
      {routes.map(route => {
      const transportIcons = getTransportIcons(route.description);
      const isSelected = selectedRoute === route.id;
      return <motion.div key={route.id} onClick={() => onRouteSelect(route.id)} className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' : 'border-border hover:border-border bg-card hover:bg-muted'}`} whileHover={{
        scale: 1.01
      }} whileTap={{
        scale: 0.99
      }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Bus className="h-5 w-5 text-blue-400" />
                <div>
                  <span className="font-semibold text-lg text-foreground">
                    {route.departureTime}–{route.arrivalTime}
                  </span>
                  {route.hasAlert && <AlertTriangle className="h-4 w-4 text-amber-400 ml-2 inline" />}
                </div>
              </div>
              <span className="font-semibold text-lg text-foreground">{route.duration}</span>
            </div>
            
            <div className="flex items-center space-x-2 mb-3">
              <Footprints className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground/70">→</span>
              
              {transportIcons.map((icon, index) => <div key={index} className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium shadow-lg ${icon === '40' ? 'bg-pink-500 text-white shadow-pink-500/30' : icon === 'SJ InterCity' ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-blue-500 text-white shadow-blue-500/30'}`}>
                    {icon}
                  </div>
                  {index < transportIcons.length - 1 && <span className="text-muted-foreground/70">→</span>}
                </div>)}
              
              <span className="text-muted-foreground/70">→</span>
              <Footprints className="h-4 w-4 text-muted-foreground" />
            </div>
            
            {route.departureLocation && <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  <span>{route.departureTime} från {route.departureLocation}</span>
                </p>
                {route.walkingTime && <p className="text-sm text-muted-foreground flex items-center space-x-1">
                    <Footprints className="h-3 w-3" />
                    <span>{route.walkingTime}</span>
                  </p>}
              </div>}

            {route.hasAlert && <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-300 flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Information</span>
                </p>
              </div>}
          </motion.div>;
    })}
    </div>;
};