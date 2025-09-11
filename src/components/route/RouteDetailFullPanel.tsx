"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Printer, Calendar, Footprints, Bus, Train, Car, Clock, MapPin, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
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
interface RouteDetailFullPanelProps {
  route: RouteOption;
  onBackClick: () => void;
  origin: string;
  destination: string;
}
const DEFAULT_ROUTE: RouteOption = {
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
    instruction: 'Gå till Storstensvägen 2',
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
    arrivalTime: '08:09',
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
    instruction: 'Gå till Torsgatan 14',
    duration: '15 min',
    distance: '1,1 km',
    departureTime: '08:48',
    arrivalTime: '09:03',
    location: 'Torsgatan 14, Stockholm'
  }]
};
export default function RouteDetailFullPanel({
  route = DEFAULT_ROUTE,
  onBackClick,
  origin = "Storstensvägen 2, Uppsala",
  destination = "Torsgatan 14, Stockholm"
}: RouteDetailFullPanelProps) {
  const [expandedSteps, setExpandedSteps] = React.useState<Set<string>>(new Set());
  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };
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
  return <div className="h-full w-full bg-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-700">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBackClick} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-300" />
          </button>
          
          <div className="flex items-center space-x-2" style={{
          display: "none"
        }}>
            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <Share2 className="h-4 w-4 text-slate-300" />
            </button>
            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <Printer className="h-4 w-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Route Summary */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">
                {route.departureTime}–{route.arrivalTime}
              </h1>
              <p className="text-slate-300 text-lg">({route.duration})</p>
            </div>
            
            <motion.button className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/30" whileHover={{
            scale: 1.02
          }} whileTap={{
            scale: 0.98
          }} style={{
            display: "none"
          }}>
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Lägg till i Kalender</span>
            </motion.button>
          </div>

          {/* Route Overview */}
          <div className="flex items-center space-x-2 text-sm text-slate-300 mb-4">
            <Footprints className="h-4 w-4" />
            <span className="text-slate-500">→</span>
            <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium shadow-lg shadow-blue-500/30">
              118
            </div>
            <span className="text-slate-500">→</span>
            <div className="bg-emerald-500 text-white px-2 py-1 rounded text-xs font-medium shadow-lg shadow-emerald-500/30">
              919
            </div>
            <span className="text-slate-500">→</span>
            <Footprints className="h-4 w-4" />
          </div>

          {/* Origin and Destination */}
          <div className="flex items-start space-x-3 mb-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-3 h-3 border-2 border-blue-400 rounded-full bg-slate-800 shadow-lg shadow-blue-400/30"></div>
              <div className="w-0.5 h-8 bg-slate-600 mt-1"></div>
              <div className="w-3 h-3 bg-red-500 rounded-sm shadow-lg shadow-red-500/30"></div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-medium text-slate-100">Från fastighet</p>
                <p className="text-sm text-slate-300">{origin}</p>
              </div>
              <div>
                <p className="font-medium text-slate-100">Till arbetsplats</p>
                <p className="text-sm text-slate-300">{destination}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Steps */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {route.steps.map((step, index) => {
          const StepIcon = getStepIcon(step.type);
          const isLast = index === route.steps.length - 1;
          const stepColor = getStepColor(step.type);
          const lineColor = getLineColor(step.line);
          const isExpanded = expandedSteps.has(step.id);
          return <motion.div key={step.id} className="flex" initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: index * 0.1
          }}>
                {/* Timeline */}
                <div className="flex flex-col items-center mr-4 min-w-[4rem]">
                  <div className="w-14 h-10 bg-slate-700 rounded-xl flex items-center justify-center border border-slate-600 shadow-lg shadow-slate-900/30">
                    <span className="text-sm font-bold text-slate-100">
                      {step.departureTime}
                    </span>
                  </div>
                  {!isLast && <div className="w-0.5 h-20 bg-gradient-to-b from-blue-400/50 to-blue-400/20 mt-3 mb-3 shadow-lg shadow-blue-400/20"></div>}
                </div>
                
                {/* Step Content */}
                <div className="flex-1 pb-4">
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        <StepIcon className={`h-6 w-6 ${stepColor}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="mb-3">
                          <h3 className="font-semibold text-slate-100 text-lg mb-1">
                            {step.location || step.instruction.split(' ').slice(0, 4).join(' ')}
                          </h3>
                          {step.location && step.location !== step.instruction && <p className="text-sm text-slate-300">{step.location}</p>}
                        </div>
                        
                        {/* Walking Step */}
                        {step.type === 'walk' && <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Footprints className="h-5 w-5 text-slate-400" />
                              <span className="text-base font-medium text-slate-200">Gå</span>
                              <span className="text-sm text-slate-400">
                                Cirka {step.duration}, {step.distance}
                              </span>
                            </div>
                            
                            <button onClick={() => toggleStepExpansion(step.id)} className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              <span className="text-sm">Visa vägbeskrivning</span>
                            </button>

                            {isExpanded && <motion.div initial={{
                        opacity: 0,
                        height: 0
                      }} animate={{
                        opacity: 1,
                        height: "auto"
                      }} exit={{
                        opacity: 0,
                        height: 0
                      }} className="bg-slate-800/50 rounded-lg p-3 mt-3">
                                <p className="text-sm text-slate-300">
                                  Detaljerad vägbeskrivning för gångväg kommer att visas här.
                                </p>
                              </motion.div>}
                          </div>}
                        
                        {/* Transit Step */}
                        {(step.type === 'bus' || step.type === 'train') && step.line && <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className={`${lineColor} text-white px-4 py-2 rounded-lg text-base font-bold`}>
                                {step.line}
                              </div>
                              <span className="text-base text-slate-200 font-medium">
                                {step.instruction.split(' ').slice(2).join(' ')}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-slate-300">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{step.duration}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{step.stops} stopp</span>
                              </div>
                            </div>

                            <button onClick={() => toggleStepExpansion(step.id)} className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              <span className="text-sm">Visa alla stopp</span>
                            </button>

                            {isExpanded && <motion.div initial={{
                        opacity: 0,
                        height: 0
                      }} animate={{
                        opacity: 1,
                        height: "auto"
                      }} exit={{
                        opacity: 0,
                        height: 0
                      }} className="bg-slate-800/50 rounded-lg p-3 mt-3">
                                <p className="text-sm text-slate-300 mb-2">Stopp på vägen:</p>
                                <div className="space-y-1">
                                  <p className="text-xs text-slate-400">• Stopp 1</p>
                                  <p className="text-xs text-slate-400">• Stopp 2</p>
                                  <p className="text-xs text-slate-400">• Stopp 3</p>
                                  <p className="text-xs text-slate-400">• ... och {(step.stops || 0) - 3} till</p>
                                </div>
                              </motion.div>}
                          </div>}
                      </div>
                    </div>

                    {/* Arrival Time for intermediate steps */}
                    {step.arrivalTime && index < route.steps.length - 1 && <div className="mt-4 pt-3 border-t border-slate-600/50">
                        <div className="flex items-center space-x-2 text-sm text-slate-300">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="font-medium">
                            Ankomst {step.arrivalTime} - {route.steps[index + 1]?.location || 'Nästa stopp'}
                          </span>
                        </div>
                      </div>}
                  </div>
                </div>
              </motion.div>;
        })}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50" style={{
        display: "none"
      }}>
          <div className="space-y-3">
            <motion.button className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-500/30" whileHover={{
            scale: 1.01
          }} whileTap={{
            scale: 0.99
          }}>
              <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
                <span className="text-xs">📱</span>
              </div>
              <span className="font-medium">Skicka vägbeskrivningar till iPhone</span>
            </motion.button>
            
            <motion.button className="w-full flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-3 px-4 rounded-lg transition-colors" whileHover={{
            scale: 1.01
          }} whileTap={{
            scale: 0.99
          }}>
              <div className="w-5 h-5 bg-slate-600 rounded flex items-center justify-center">
                <span className="text-xs">🔗</span>
              </div>
              <span className="font-medium">Kopiera länk</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>;
}