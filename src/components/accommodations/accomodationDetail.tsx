import React from 'react';
import { motion } from 'framer-motion';
import { X, Calculator, TrendingUp, TrendingDown, BarChart3, Info, DollarSign, Home, MapPin, Clock } from 'lucide-react';
interface DetailPanelData {
  propertyId: string;
  metricId: string;
  propertyTitle: string;
  metricLabel: string;
  value: string;
  unit: string;
}
interface PropertyDetailPanelProps {
  detailPanel: DetailPanelData | null;
  isDarkMode: boolean;
  onClose: () => void;
}

// @component: PropertyDetailPanel
export const PropertyDetailPanel = ({
  detailPanel,
  isDarkMode,
  onClose
}: PropertyDetailPanelProps) => {
  if (!detailPanel) return null;
  const getMetricDetails = (metricId: string, value: string) => {
    const numericValue = parseInt(value.replace(/\s/g, '')) || 0;
    switch (metricId) {
      case 'monthly_cost':
        return {
          breakdown: [{
            label: 'Bolånekostnad',
            value: Math.floor(numericValue * 0.65),
            description: 'Månadsavgift för bolån baserat på aktuell ränta'
          }, {
            label: 'Driftskostnader',
            value: Math.floor(numericValue * 0.20),
            description: 'El, värme, vatten och underhåll'
          }, {
            label: 'Försäkringar',
            value: Math.floor(numericValue * 0.08),
            description: 'Hemförsäkring och villaförsäkring'
          }, {
            label: 'Kommunalskatt',
            value: Math.floor(numericValue * 0.07),
            description: 'Fastighetsskatt och kommunala avgifter'
          }],
          insights: ['Denna kostnad är baserad på 85% belåning med 3.2% ränta', 'Inkluderar amortering enligt standardplan', 'Driftskostnader varierar med säsong och användning']
        };
      case 'asking_price':
        return {
          breakdown: [{
            label: 'Grundpris',
            value: Math.floor(numericValue * 0.85),
            description: 'Fastighetens bedömda marknadsvärde'
          }, {
            label: 'Budreserv',
            value: Math.floor(numericValue * 0.10),
            description: 'Förväntad budgivning över utropspris'
          }, {
            label: 'Tillkommande kostnader',
            value: Math.floor(numericValue * 0.05),
            description: 'Lagfart, pantbrev och mäklararvode'
          }],
          insights: ['Utropspriset är ofta lägre än slutpriset', 'Genomsnittlig budgivning i området: +12%', 'Prishistorik visar stigande trend senaste året']
        };
      case 'living_area':
        return {
          breakdown: [{
            label: 'Vardagsrum',
            value: Math.floor(numericValue * 0.35),
            description: 'Kök, vardagsrum och matsal',
            unit: 'm²'
          }, {
            label: 'Sovrum',
            value: Math.floor(numericValue * 0.40),
            description: 'Alla sovrum och walk-in-closets',
            unit: 'm²'
          }, {
            label: 'Badrum',
            value: Math.floor(numericValue * 0.15),
            description: 'Badrum, toaletter och tvättstuga',
            unit: 'm²'
          }, {
            label: 'Övrigt',
            value: Math.floor(numericValue * 0.10),
            description: 'Hall, förråd och övriga utrymmen',
            unit: 'm²'
          }],
          insights: ['Bostadsytan är mätt enligt svensk standard (BRA)', 'Inkluderar inte källare eller vind', 'Genomsnittlig bostadsyta i området: 165 m²']
        };
      default:
        return {
          breakdown: [{
            label: 'Huvudvärde',
            value: Math.floor(numericValue * 0.80),
            description: 'Primär komponent'
          }, {
            label: 'Tillägg',
            value: Math.floor(numericValue * 0.20),
            description: 'Sekundära faktorer'
          }],
          insights: ['Värdet baseras på aktuella marknadsförhållanden', 'Jämförelse med liknande fastigheter i området']
        };
    }
  };
  const details = getMetricDetails(detailPanel.metricId, detailPanel.value);
  const totalBreakdown = details.breakdown.reduce((sum, item) => sum + item.value, 0);

  // @return
  return <div className="fixed inset-0 z-50 flex">
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{
      x: '100%'
    }} animate={{
      x: 0
    }} exit={{
      x: '100%'
    }} transition={{
      type: 'spring',
      damping: 25,
      stiffness: 200
    }} className={`ml-auto w-full max-w-lg h-full shadow-2xl ${isDarkMode ? 'bg-slate-900 border-l border-slate-700' : 'bg-white border-l border-gray-200'}`}>
        <div className="flex flex-col h-full">
          {/* Panel Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-semibold mb-1">
                <span>{detailPanel.metricLabel}</span>
              </h2>
              <div className="flex items-center space-x-2">
                <Home className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  <span>{detailPanel.propertyTitle}</span>
                </p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`} aria-label="Close detail panel">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* Main Value Display */}
              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    <span>{detailPanel.value}</span>
                  </div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    <span>{detailPanel.unit}</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Section */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  <span>Detaljerad uppdelning</span>
                </h3>
                <div className="space-y-4">
                  {details.breakdown.map((item, index) => <motion.div key={index} initial={{
                  opacity: 0,
                  x: -20
                }} animate={{
                  opacity: 1,
                  x: 0
                }} transition={{
                  delay: index * 0.1
                }} className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">
                            <span>{item.label}</span>
                          </h4>
                          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            <span>{item.description}</span>
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-lg">
                            <span>{item.value.toLocaleString()}</span>
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                            <span>{item.unit || detailPanel.unit}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className={`w-full h-2 rounded-full mt-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style={{
                      width: `${item.value / totalBreakdown * 100}%`
                    }}></div>
                      </div>
                    </motion.div>)}
                </div>
              </div>

              {/* Market Comparison */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  <span>Marknadsjämförelse</span>
                </h3>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      <span>Jämfört med området</span>
                    </span>
                    <div className="flex items-center space-x-1">
                      {Math.random() > 0.5 ? <TrendingUp className="h-4 w-4 text-red-500" /> : <TrendingDown className="h-4 w-4 text-green-500" />}
                      <span className="text-sm font-medium">
                        <span>{Math.random() > 0.5 ? '+' : '-'}{Math.floor(Math.random() * 20 + 5)}%</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        <span>Genomsnitt i området</span>
                      </span>
                      <span className="font-medium">
                        <span>{Math.floor(parseInt(detailPanel.value.replace(/\s/g, '')) * (0.8 + Math.random() * 0.4)).toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        <span>Högsta värde</span>
                      </span>
                      <span className="font-medium">
                        <span>{Math.floor(parseInt(detailPanel.value.replace(/\s/g, '')) * 1.3).toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        <span>Lägsta värde</span>
                      </span>
                      <span className="font-medium">
                        <span>{Math.floor(parseInt(detailPanel.value.replace(/\s/g, '')) * 0.6).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  <span>Viktiga insikter</span>
                </h3>
                <div className="space-y-3">
                  {details.insights.map((insight, index) => <motion.div key={index} initial={{
                  opacity: 0,
                  y: 10
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  delay: 0.5 + index * 0.1
                }} className={`p-4 rounded-lg border-l-4 ${isDarkMode ? 'bg-slate-800 border-l-blue-500 border border-slate-700' : 'bg-blue-50 border-l-blue-500 border border-blue-200'}`}>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        <span>{insight}</span>
                      </p>
                    </motion.div>)}
                </div>
              </div>

              {/* Historical Data */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>Historisk utveckling</span>
                </h3>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        <span>För 1 år sedan</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          <span>{Math.floor(parseInt(detailPanel.value.replace(/\s/g, '')) * 0.92).toLocaleString()}</span>
                        </span>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        <span>För 6 månader sedan</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          <span>{Math.floor(parseInt(detailPanel.value.replace(/\s/g, '')) * 0.96).toLocaleString()}</span>
                        </span>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        <span>Nuvarande värde</span>
                      </span>
                      <span className="font-semibold text-blue-500">
                        <span>{detailPanel.value}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>;
};