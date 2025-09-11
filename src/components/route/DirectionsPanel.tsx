"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Printer, X, Car, Bus, Footprints, Bike, ArrowUpDown, Plus, Clock, Calendar } from 'lucide-react';
interface DirectionsPanelProps {
  selectedMode: string;
  onModeChange: (mode: string) => void;
  origin: string;
  destination: string;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onSwapAddresses: () => void;
  showDetails: boolean;
  onBackClick: () => void;
  children: React.ReactNode;
}
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

// @component: DirectionsPanel
export const DirectionsPanel = ({
  selectedMode,
  onModeChange,
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onSwapAddresses,
  showDetails,
  onBackClick,
  children
}: DirectionsPanelProps) => {
  // @return
  return <div className="w-full max-w-md bg-slate-800 shadow-xl border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <button onClick={onBackClick} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-300" />
        </button>
        <div className="flex items-center space-x-2">
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
      <div className="p-4 border-b border-slate-700">
        <div className="flex space-x-1 bg-slate-700/50 rounded-xl p-1">
          {TRANSPORT_MODES.map(mode => {
          const IconComponent = mode.icon;
          const isActive = selectedMode === mode.id;
          return <button key={mode.id} onClick={() => onModeChange(mode.id)} className={`flex-1 flex flex-col items-center py-3 px-2 rounded-lg transition-all ${isActive ? 'bg-blue-500 shadow-lg shadow-blue-500/30 text-white' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-600/50'}`}>
                <IconComponent className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{mode.label}</span>
                <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{mode.time}</span>
              </button>;
        })}
        </div>
      </div>

      {/* Route Input Section */}
      <div className="p-4 border-b border-slate-700">
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 border-2 border-blue-400 rounded-full bg-slate-800 shadow-lg shadow-blue-400/30"></div>
            <input type="text" value={origin} onChange={e => onOriginChange(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-slate-700/50 text-slate-100 placeholder-slate-400" placeholder="Från" />
          </div>
          
          <div className="flex justify-center">
            <button onClick={onSwapAddresses} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowUpDown className="h-4 w-4 text-slate-300" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-sm shadow-lg shadow-red-500/30"></div>
            <input type="text" value={destination} onChange={e => onDestinationChange(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-slate-700/50 text-slate-100 placeholder-slate-400" placeholder="Till" />
          </div>

          <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Lägg till destination</span>
          </button>
        </div>
      </div>

      {/* Time Selection */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-slate-300" />
            <span className="text-sm font-medium text-slate-300">Ankomst kl.</span>
            <select className="text-sm border-none bg-transparent focus:ring-0 text-slate-200">
              <option>09:05</option>
              <option>10:00</option>
              <option>11:00</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-300" />
            <span className="text-sm text-slate-300">tors 11 sep.</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex space-x-4">
          <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white text-xs">📱</span>
            </div>
            <span className="text-sm font-medium">Skicka vägbeskrivningar till iPhone</span>
          </button>
        </div>
        <div className="mt-3">
          <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white text-xs">🔗</span>
            </div>
            <span className="text-sm font-medium">Kopiera länk</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>;
};