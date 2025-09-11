"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Printer, X, Car, Bus, Footprints, Bike, Clock, Calendar, MapPin } from 'lucide-react';
import { WorkAddressMap } from './WorkAddressMap';
import RouteDetailFullPanel from './RouteDetailFullPanel';
interface RouteOption {
  id: string;
  mode: 'car' | 'transit' | 'walking' | 'biking';
  duration: string;
  distance: string;
  description: string;
  departureTime?: string;
  arrivalTime?: string;
  steps: RouteStep[];
}
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
  location?: string;
}
const ROUTE_OPTIONS: RouteOption[] = [{
  id: '1',
  mode: 'transit',
  duration: '1 tim 51 min',
  distance: '11.2 km',
  description: 'via Route 118 and 919',
  departureTime: '07:12',
  arrivalTime: '09:03',
  steps: [{
    id: '1',
    type: 'walk',
    instruction: 'Gå till Norrhagen',
    duration: '18 min',
    distance: '1,3 km',
    departureTime: '07:12',
    arrivalTime: '07:30',
    location: 'Storstensvägen 2'
  }, {
    id: '2',
    type: 'bus',
    instruction: 'Ta buss 118 mot Uppsala Centralstation',
    duration: '21 min',
    line: '118',
    stops: 9,
    departureTime: '07:30',
    arrivalTime: '07:51',
    location: 'Norrhagen'
  }, {
    id: '3',
    type: 'train',
    instruction: 'Ta tåg 919 mot Arboga station',
    duration: '39 min',
    line: '919',
    stops: 3,
    departureTime: '08:09',
    arrivalTime: '08:48',
    location: 'Uppsala Centralstation'
  }, {
    id: '4',
    type: 'walk',
    instruction: 'Gå till destination',
    duration: '15 min',
    distance: '1,1 km',
    departureTime: '08:48',
    arrivalTime: '09:03',
    location: 'Torsgatan 14'
  }]
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
}];
const TRANSPORT_MODES = [{
  id: 'car',
  icon: Car,
  label: 'Bil',
  time: '1h 5m'
}, {
  id: 'transit',
  icon: Bus,
  label: 'Kollektivt',
  time: '1h 50m',
  active: true
}, {
  id: 'walking',
  icon: Footprints,
  label: 'Gå',
  time: '18 tim'
}, {
  id: 'biking',
  icon: Bike,
  label: 'Cykel',
  time: '4h 22m'
}] as any[];

// @component: DirectionsDetailView
export const DirectionsDetailView = () => {
  const [selectedMode, setSelectedMode] = useState<string>('transit');
  const [selectedRoute, setSelectedRoute] = useState<string>('1');
  const [showDetails, setShowDetails] = useState(false); // Start with route list

  // Fixed property and workplace addresses
  const propertyAddress = 'Storstensvägen 2, Uppsala';
  const workplaceAddress = 'Torsgatan 14, Stockholm';
  const arrivalTime = '09:00'; // Fixed arrival time requirement

  const currentRoute = ROUTE_OPTIONS.find(route => route.id === selectedRoute);
  const getStepIcon = (type: string) => {
    switch (type) {
      case 'walk':
        return Footprints;
      case 'bus':
        return Bus;
      case 'train':
        return Bus;
      case 'drive':
        return Car;
      default:
        return Footprints;
    }
  };
  const getStepColor = (type: string) => {
    switch (type) {
      case 'walk':
        return 'text-slate-400';
      case 'bus':
        return 'text-blue-400';
      case 'train':
        return 'text-emerald-400';
      case 'drive':
        return 'text-purple-400';
      default:
        return 'text-slate-400';
    }
  };
  const getLineColor = (line?: string) => {
    if (!line) return 'bg-slate-600';
    if (line === '118') return 'bg-blue-500 shadow-lg shadow-blue-500/30';
    if (line === '919') return 'bg-emerald-500 shadow-lg shadow-emerald-500/30';
    if (line === '40') return 'bg-pink-500 shadow-lg shadow-pink-500/30';
    return 'bg-slate-600';
  };

  // @return
  return <div className="h-screen w-full flex bg-slate-900">
      {/* Directions Panel */}
      <div className="w-full max-w-md bg-slate-800 shadow-xl border-r border-slate-700 flex flex-col">
        {showDetails ? <RouteDetailFullPanel route={currentRoute!} onBackClick={() => setShowDetails(false)} origin={propertyAddress} destination={workplaceAddress} /> : <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-300" />
              </button>
              <div className="flex items-center space-x-2" style={{
            display: "none"
          }}>
                <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                  <Share2 className="h-5 w-5 text-slate-300" />
                </button>
                <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                  <Printer className="h-5 w-5 text-slate-300" />
                </button>
                <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-slate-300" />
                </button>
              </div>
            </div>

            {/* Transportation Mode Selector */}
            

            {/* Fixed Route Information */}
            <div className="p-4 border-b border-slate-700">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-3 h-3 border-2 border-blue-400 rounded-full bg-slate-800 shadow-lg shadow-blue-400/30"></div>
                    <div className="w-0.5 h-8 bg-slate-600 mt-1"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-sm shadow-lg shadow-red-500/30"></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-medium text-slate-100">Från fastighet</p>
                      <p className="text-sm text-slate-300">{propertyAddress}</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">Till arbetsplats</p>
                      <p className="text-sm text-slate-300">{workplaceAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrival Time Requirement */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex space-x-1 bg-slate-700/50 rounded-xl p-1">
                {TRANSPORT_MODES.map(mode => {
              const IconComponent = mode.icon;
              const isActive = selectedMode === mode.id;
              return <button key={mode.id} onClick={() => setSelectedMode(mode.id)} className={`flex-1 flex flex-col items-center py-3 px-2 rounded-lg transition-all ${isActive ? 'bg-blue-500 shadow-lg shadow-blue-500/30 text-white' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-600/50'}`}>
                      <IconComponent className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">{mode.label}</span>
                      <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{mode.time}</span>
                    </button>;
            })}
              </div>
            </div>

            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-slate-300" />
                  <span className="text-sm font-medium text-slate-300">Ankomst senast</span>
                  <span className="text-sm font-semibold text-slate-100">{arrivalTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-300" />
                  <span className="text-sm text-slate-300">Vardagar</span>
                </div>
              </div>
            </div>

            {/* Route Options */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">
                {ROUTE_OPTIONS.map(route => <motion.div key={route.id} onClick={() => {
              setSelectedRoute(route.id);
              setShowDetails(true);
            }} className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-lg ${selectedRoute === route.id ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-700/50'}`} whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Bus className="h-5 w-5 text-blue-400" />
                        <span className="font-semibold text-lg text-slate-100">{route.departureTime}–{route.arrivalTime}</span>
                      </div>
                      <span className="font-semibold text-lg text-slate-100">{route.duration}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-slate-300 mb-2">
                      <Footprints className="h-4 w-4" />
                      <span>→</span>
                      <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium shadow-lg shadow-blue-500/30">118</div>
                      <span>→</span>
                      <div className="bg-emerald-500 text-white px-2 py-1 rounded text-xs font-medium shadow-lg shadow-emerald-500/30">919</div>
                      <span>→</span>
                      <Footprints className="h-4 w-4" />
                    </div>
                    
                    <p className="text-sm text-slate-300">{route.departureTime} från Norrhagen</p>
                    <p className="text-sm text-slate-300 flex items-center space-x-1">
                      <Footprints className="h-3 w-3" />
                      <span>33 min gång totalt</span>
                    </p>
                  </motion.div>)}
              </div>
            </div>
          </>}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <WorkAddressMap />
      </div>
    </div>;
};