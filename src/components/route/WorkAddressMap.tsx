"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Briefcase } from 'lucide-react';
interface WorkAddress {
  id: string;
  person: string;
  address: string;
  lat: number;
  lng: number;
  color: string;
}

// @component: WorkAddressMap
export const WorkAddressMap = () => {
  const [workAddresses, setWorkAddresses] = useState<WorkAddress[]>([]);
  const [mapCenter, setMapCenter] = useState({
    lat: 59.3293,
    lng: 18.0686
  }); // Stockholm default

  useEffect(() => {
    // Load work addresses from localStorage or use default data
    const savedAddresses = localStorage.getItem('pendlingskollen_work_addresses');
    if (savedAddresses) {
      const addresses = JSON.parse(savedAddresses);
      setWorkAddresses(addresses);

      // Calculate center point of all addresses
      if (addresses.length > 0) {
        const avgLat = addresses.reduce((sum: number, addr: WorkAddress) => sum + addr.lat, 0) / addresses.length;
        const avgLng = addresses.reduce((sum: number, addr: WorkAddress) => sum + addr.lng, 0) / addresses.length;
        setMapCenter({
          lat: avgLat,
          lng: avgLng
        });
      }
    } else {
      // Default work addresses for demo
      const defaultAddresses: WorkAddress[] = [{
        id: '1',
        person: 'Person 1',
        address: 'Sergels torg, Stockholm',
        lat: 59.3325,
        lng: 18.0649,
        color: 'blue'
      }, {
        id: '2',
        person: 'Person 2',
        address: 'Gamla stan, Stockholm',
        lat: 59.3251,
        lng: 18.0711,
        color: 'green'
      }];
      setWorkAddresses(defaultAddresses);
    }
  }, []);

  // @return
  return <div className="w-full h-full relative bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
      {/* Simplified Map Visualization */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 to-slate-900/30">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
          backgroundImage: `
              linear-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.15) 1px, transparent 1px)
            `,
          backgroundSize: '40px 40px'
        }} />
        </div>

        {/* Map Markers */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-96 h-96">
            {workAddresses.map((address, index) => <motion.div key={address.id} initial={{
            scale: 0,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} transition={{
            delay: index * 0.2,
            duration: 0.5
          }} className="absolute" style={{
            left: `${30 + index * 40}%`,
            top: `${40 + index * 20}%`,
            transform: 'translate(-50%, -50%)'
          }}>
                {/* Marker Pin */}
                <div className={`relative ${address.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'} drop-shadow-lg`}>
                  <MapPin className="h-12 w-12 drop-shadow-lg filter drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" fill="currentColor" />
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                    <Briefcase className="h-4 w-4 text-slate-900" />
                  </div>
                </div>

                {/* Marker Label */}
                <motion.div initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: index * 0.2 + 0.3
            }} className="absolute top-14 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg shadow-black/25 border border-slate-700/60">
                    <div className="flex items-center space-x-2">
                      <User className={`h-4 w-4 ${address.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          <span>{address.person}</span>
                        </p>
                        <p className="text-xs text-slate-300">
                          <span>{address.address}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Pulsing Animation */}
                <motion.div animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 0, 0.4]
            }} transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.5
            }} className={`absolute top-0 left-0 w-12 h-12 rounded-full ${address.color === 'blue' ? 'bg-blue-400/30' : 'bg-emerald-400/30'} shadow-lg ${address.color === 'blue' ? 'shadow-blue-400/20' : 'shadow-emerald-400/20'}`} />
              </motion.div>)}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse shadow-lg shadow-blue-400/20" />
        <div className="absolute top-3/4 right-1/3 w-3 h-3 bg-emerald-400/40 rounded-full animate-pulse shadow-lg shadow-emerald-400/20" style={{
        animationDelay: '1s'
      }} />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-slate-400/50 rounded-full animate-pulse" style={{
        animationDelay: '2s'
      }} />
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col space-y-2">
        <motion.button whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }} className="w-12 h-12 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg shadow-black/25 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-slate-100 transition-colors">
          <span className="text-xl font-bold">+</span>
        </motion.button>
        <motion.button whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }} className="w-12 h-12 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg shadow-black/25 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-slate-100 transition-colors">
          <span className="text-xl font-bold">−</span>
        </motion.button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6">
        <div className="bg-slate-900/95 backdrop-blur-sm rounded-xl p-4 shadow-lg shadow-black/25 border border-slate-700/60">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">
            <span>Arbetsplatser</span>
          </h3>
          <div className="space-y-2">
            {workAddresses.map(address => <div key={address.id} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${address.color === 'blue' ? 'bg-blue-400 shadow-lg shadow-blue-400/30' : 'bg-emerald-400 shadow-lg shadow-emerald-400/30'}`} />
                <span className="text-xs text-slate-200">{address.person}</span>
              </div>)}
          </div>
        </div>
      </div>
    </div>;
};