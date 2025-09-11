"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Printer, Calendar, Footprints, Bus, Train, Car } from 'lucide-react';
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
interface RouteDetailStepsProps {
  route: RouteOption;
  onBackClick: () => void;
  origin: string;
  destination: string;
}
const DEFAULT_STEPS: RouteStep[] = [{
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
  location: 'Stockholms Central'
}];

// @component: RouteDetailSteps
export const RouteDetailSteps = ({
  route,
  onBackClick,
  origin,
  destination
}: RouteDetailStepsProps) => {
  const steps = route.steps.length > 0 ? route.steps : DEFAULT_STEPS;
  const getStepIcon = (type: string) => {
    switch (type) {
      case 'walk':
        return Footprints;
      case 'bus':
        return Bus;
      case 'train':
        return Train;
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
  return <div className="p-4">
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={onBackClick} className="p-1 hover:bg-slate-700 rounded transition-colors">
          <ArrowLeft className="h-4 w-4 text-slate-300" />
        </button>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-100">från {origin.split('(')[0].trim()}</h3>
          <p className="text-sm text-slate-300">till {destination.split('(')[0].trim()}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              {route.departureTime}–{route.arrivalTime}
            </h2>
            <p className="text-slate-300">({route.duration})</p>
          </div>
          <div className="flex space-x-2">
            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white text-xs">📱</span>
              </div>
            </button>
            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <Share2 className="h-4 w-4 text-slate-300" />
            </button>
            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <Printer className="h-4 w-4 text-slate-300" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-slate-300 mb-6">
          <Footprints className="h-4 w-4" />
          <span className="text-slate-500">→</span>
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium shadow-lg shadow-blue-500/30">118</div>
          <span className="text-slate-500">→</span>
          <div className="bg-emerald-500 text-white px-2 py-1 rounded text-xs font-medium shadow-lg shadow-emerald-500/30">919</div>
          <span className="text-slate-500">→</span>
          <Footprints className="h-4 w-4" />
        </div>

        <motion.button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors mb-8" whileHover={{
        scale: 1.02
      }} whileTap={{
        scale: 0.98
      }}>
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">Lägg till i Kalender</span>
        </motion.button>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => {
        const StepIcon = getStepIcon(step.type);
        const isLast = index === steps.length - 1;
        const stepColor = getStepColor(step.type);
        const lineColor = getLineColor(step.line);
        return <motion.div key={step.id} className="flex" initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: index * 0.1
        }}>
              <div className="flex flex-col items-center mr-4 min-w-[3rem]">
                <div className="w-12 h-8 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600 shadow-lg shadow-slate-900/30">
                  <span className="text-sm font-semibold text-slate-100">{step.departureTime}</span>
                </div>
                {!isLast && <div className="w-0.5 h-16 bg-blue-400/50 mt-2 mb-2 shadow-lg shadow-blue-400/20"></div>}
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <StepIcon className={`h-5 w-5 ${stepColor}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="mb-2">
                      <h4 className="font-medium text-slate-100 mb-1">
                        {step.location || step.instruction.split(' ').slice(0, 3).join(' ')}
                      </h4>
                      {step.location && step.location !== step.instruction && <p className="text-sm text-slate-300">{step.location}</p>}
                    </div>
                    
                    {step.type === 'walk' && <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Footprints className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-200">Gå</span>
                        </div>
                        <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                          <span>▼</span>
                          <span>Cirka {step.duration}, {step.distance}</span>
                        </button>
                      </div>}
                    
                    {(step.type === 'bus' || step.type === 'train') && step.line && <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className={`${lineColor} text-white px-3 py-1 rounded text-sm font-medium`}>
                            {step.line}
                          </div>
                          <span className="text-sm text-slate-200 font-medium">
                            {step.instruction.split(' ').slice(2).join(' ')}
                          </span>
                        </div>
                        <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                          <span>▼</span>
                          <span>{step.duration} ({step.stops} stopp)</span>
                        </button>
                      </div>}
                  </div>
                </div>
                
                {step.arrivalTime && index < steps.length - 1 && <div className="mt-4 ml-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 border-2 border-blue-400 rounded-full bg-slate-800 shadow-lg shadow-blue-400/30"></div>
                      <span className="text-sm font-medium text-slate-200">
                        {steps[index + 1]?.location || 'Nästa stopp'}
                      </span>
                    </div>
                  </div>}
              </div>
            </motion.div>;
      })}
      </div>
    </div>;
};