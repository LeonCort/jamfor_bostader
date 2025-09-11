"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MapPin, Clock, Car, Train, Home, Ruler, Bed, Bath, Plus, X, Eye, ArrowRight, Calendar, TrendingUp, Building2, DollarSign } from 'lucide-react';
import { WorkAddressMap } from './WorkAddressMap';
interface Property {
  id: string;
  title: string;
  address: string;
  price: string;
  pricePerSqm: string;
  image: string;
  rooms: string;
  size: string;
  yearBuilt: string;
  monthlyFee: string;
  isFavorited: boolean;
  travelTimes: {
    person: string;
    carTime: string;
    transitTime: string;
    color: string;
  }[];
  lat: number;
  lng: number;
}

// @component: PropertyComparisonView
export const PropertyComparisonView = () => {
  const [properties, setProperties] = useState<Property[]>([{
    id: '1',
    title: 'Ljus 3:a med balkong i Södermalm',
    address: 'Götgatan 45, Södermalm, Stockholm',
    price: '4 950 000 kr',
    pricePerSqm: '82 500 kr/m²',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    rooms: '3 rum',
    size: '60 m²',
    yearBuilt: '1925',
    monthlyFee: '4 200 kr/mån',
    isFavorited: false,
    travelTimes: [{
      person: 'Person 1',
      carTime: '12 min',
      transitTime: '18 min',
      color: 'blue'
    }, {
      person: 'Person 2',
      carTime: '8 min',
      transitTime: '15 min',
      color: 'green'
    }],
    lat: 59.3157,
    lng: 18.0717
  }, {
    id: '2',
    title: 'Modern 2:a med terrass i Vasastan',
    address: 'Upplandsgatan 12, Vasastan, Stockholm',
    price: '5 200 000 kr',
    pricePerSqm: '86 667 kr/m²',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    rooms: '2 rum',
    size: '55 m²',
    yearBuilt: '2018',
    monthlyFee: '3 800 kr/mån',
    isFavorited: true,
    travelTimes: [{
      person: 'Person 1',
      carTime: '15 min',
      transitTime: '22 min',
      color: 'blue'
    }, {
      person: 'Person 2',
      carTime: '18 min',
      transitTime: '25 min',
      color: 'green'
    }],
    lat: 59.3498,
    lng: 18.0649
  }]);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newPropertyLink, setNewPropertyLink] = useState('');
  const toggleFavorite = (propertyId: string) => {
    setProperties(prev => prev.map(prop => prop.id === propertyId ? {
      ...prop,
      isFavorited: !prop.isFavorited
    } : prop));
  };
  const removeProperty = (propertyId: string) => {
    setProperties(prev => prev.filter(prop => prop.id !== propertyId));
  };
  const handleAddProperty = () => {
    if (!newPropertyLink.trim()) return;
    // In a real app, this would parse the Hemnet link and add the property
    setNewPropertyLink('');
    setShowAddProperty(false);
  };
  const comparisonData = [{
    label: 'Pris',
    prop1: properties[0]?.price,
    prop2: properties[1]?.price
  }, {
    label: 'Pris per m²',
    prop1: properties[0]?.pricePerSqm,
    prop2: properties[1]?.pricePerSqm
  }, {
    label: 'Storlek',
    prop1: properties[0]?.size,
    prop2: properties[1]?.size
  }, {
    label: 'Rum',
    prop1: properties[0]?.rooms,
    prop2: properties[1]?.rooms
  }, {
    label: 'Byggår',
    prop1: properties[0]?.yearBuilt,
    prop2: properties[1]?.yearBuilt
  }, {
    label: 'Avgift',
    prop1: properties[0]?.monthlyFee,
    prop2: properties[1]?.monthlyFee
  }];

  // @return
  return <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-white">
      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 lg:px-8 lg:py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              <span>Jämför dina bostäder</span>
            </h1>
            <span className="hidden lg:block text-slate-400">•</span>
            <p className="hidden lg:block text-slate-600">
              <span>Se hur dina drömbostad ligger till gentemot dina arbetsplatser</span>
            </p>
          </div>

          <motion.button onClick={() => setShowAddProperty(true)} whileHover={{
          scale: 1.02
        }} whileTap={{
          scale: 0.98
        }} className="flex items-center space-x-2 px-4 py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="text-sm lg:text-base">Lägg till bostad</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        
        {/* Comparison Table - Primary Focus */}
        {properties.length >= 2 && <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
            <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-blue-50 to-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    <span>Detaljerad jämförelse</span>
                  </h2>
                  <p className="text-sm text-slate-600">
                    <span>Jämför nyckeltal sida vid sida</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-6 font-semibold text-slate-900 w-1/3">
                      <span>Egenskap</span>
                    </th>
                    <th className="text-left p-6 font-semibold text-slate-900 w-1/3">
                      <span>Bostad 1</span>
                    </th>
                    <th className="text-left p-6 font-semibold text-slate-900 w-1/3">
                      <span>Bostad 2</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => <tr key={index} className="border-t border-slate-200/60 hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 font-medium text-slate-700">
                        <span>{row.label}</span>
                      </td>
                      <td className="p-6 text-slate-900 font-semibold">
                        <span>{row.prop1}</span>
                      </td>
                      <td className="p-6 text-slate-900 font-semibold">
                        <span>{row.prop2}</span>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </motion.div>}

        {/* Property Cards - Single Column with Enhanced Details */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                <span>Dina bostäder</span>
              </h2>
              <p className="text-sm text-slate-600">
                <span>Detaljerad information om varje bostad</span>
              </p>
            </div>
          </div>

          {properties.map((property, index) => <motion.div key={property.id} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2 + index * 0.1
        }} className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
              <div className="lg:flex">
                {/* Property Image */}
                <div className="relative lg:w-80 h-64 lg:h-auto lg:flex-shrink-0">
                  <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <motion.button onClick={() => toggleFavorite(property.id)} whileHover={{
                  scale: 1.1
                }} whileTap={{
                  scale: 0.9
                }} className={`w-10 h-10 rounded-full backdrop-blur-sm border border-white/60 flex items-center justify-center transition-colors ${property.isFavorited ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-600 hover:text-red-500'}`}>
                      <Heart className={`h-5 w-5 ${property.isFavorited ? 'fill-current' : ''}`} />
                    </motion.button>
                    <motion.button onClick={() => removeProperty(property.id)} whileHover={{
                  scale: 1.1
                }} whileTap={{
                  scale: 0.9
                }} className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full border border-white/60 flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors">
                      <X className="h-5 w-5" />
                    </motion.button>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-slate-900">{property.pricePerSqm}</span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Property Details */}
                <div className="flex-1 p-6 lg:p-8 space-y-6">
                  {/* Header */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-900 line-clamp-2">
                      <span>{property.title}</span>
                    </h3>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <MapPin className="h-5 w-5" />
                      <span>{property.address}</span>
                    </div>
                    <div className="flex items-baseline space-x-3">
                      <span className="text-3xl font-bold text-slate-900">{property.price}</span>
                      <span className="text-lg text-slate-600 font-medium">({property.pricePerSqm})</span>
                    </div>
                  </div>

                  {/* Property Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Home className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-slate-600">Rum</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">{property.rooms}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Ruler className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-slate-600">Storlek</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">{property.size}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-slate-600">Byggår</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">{property.yearBuilt}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-slate-600">Avgift</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">{property.monthlyFee}</span>
                    </div>
                  </div>

                  {/* Enhanced Travel Times */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span>Restider till arbetsplatser</span>
                    </h4>
                    <div className="grid gap-3">
                      {property.travelTimes.map((travel, travelIndex) => <div key={`${property.id}-${travelIndex}`} className="bg-gradient-to-r from-slate-50 to-white border border-slate-200/60 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full ${travel.color === 'blue' ? 'bg-blue-600' : 'bg-green-600'}`} />
                              <span className="font-semibold text-slate-900">{travel.person}</span>
                            </div>
                            <div className="flex items-center space-x-6">
                              <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                                <Car className="h-4 w-4 text-slate-600" />
                                <span className="font-semibold text-slate-900">{travel.carTime}</span>
                              </div>
                              <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                                <Train className="h-4 w-4 text-slate-600" />
                                <span className="font-semibold text-slate-900">{travel.transitTime}</span>
                              </div>
                            </div>
                          </div>
                        </div>)}
                    </div>
                  </div>

                  {/* Action Button */}
                  <motion.button whileHover={{
                scale: 1.02
              }} whileTap={{
                scale: 0.98
              }} className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-semibold rounded-xl transition-all duration-200 border border-slate-200/60">
                    <Eye className="h-5 w-5" />
                    <span>Visa fullständiga detaljer</span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>)}
        </div>

        {/* Enhanced Map Section with 500px Height */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4
      }} className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  <span>Karta med bostäder och arbetsplatser</span>
                </h2>
                <p className="text-sm text-slate-600">
                  <span>Visualisering av alla platser och avstånd</span>
                </p>
              </div>
            </div>
          </div>
          <div className="h-[500px] relative">
            <WorkAddressMap />
            
            {/* Property Location Markers Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {properties.map((property, index) => <motion.div key={`marker-${property.id}`} initial={{
              scale: 0,
              opacity: 0
            }} animate={{
              scale: 1,
              opacity: 1
            }} transition={{
              delay: 0.5 + index * 0.2,
              duration: 0.5
            }} className="absolute" style={{
              left: `${20 + index * 30}%`,
              top: `${60 + index * 15}%`,
              transform: 'translate(-50%, -50%)'
            }}>
                  <div className="relative">
                    <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <Home className="h-4 w-4 text-white" />
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg border border-white/60 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-900">Bostad {index + 1}</span>
                    </div>
                    {/* Pulsing animation for property markers */}
                    <motion.div animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.4, 0, 0.4]
                }} transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: index * 0.5
                }} className="absolute top-0 left-0 w-8 h-8 bg-red-500 rounded-full" />
                  </div>
                </motion.div>)}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add Property Modal */}
      {showAddProperty && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 w-full max-w-md">
            <div className="p-6 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  <span>Lägg till bostad</span>
                </h3>
                <motion.button onClick={() => setShowAddProperty(false)} whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.9
            }} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  <span>Hemnet-länk</span>
                </label>
                <input type="text" value={newPropertyLink} onChange={e => setNewPropertyLink(e.target.value)} placeholder="Klistra in länk från Hemnet..." className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors" />
              </div>
              <div className="flex space-x-3">
                <motion.button onClick={() => setShowAddProperty(false)} whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors">
                  <span>Avbryt</span>
                </motion.button>
                <motion.button onClick={handleAddProperty} disabled={!newPropertyLink.trim()} whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }} className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                  <span>Lägg till</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>}
    </div>;
};
