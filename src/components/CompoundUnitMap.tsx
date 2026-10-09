import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Unit } from '../types';
import { 
  MapPin, 
  Compass, 
  Search, 
  Eye, 
  Sparkles, 
  Navigation, 
  Maximize2,
  X
} from 'lucide-react';

interface CompoundUnitMapProps {
  units: Unit[];
  onSelectUnit: (unit: Unit) => void;
  isArabic: boolean;
  theme?: 'dark' | 'light';
}

// District Geo Centers in 6th of October & Sheikh Zayed
interface DistrictCoord {
  id: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  zoom: number;
  descriptionAr: string;
}

const DISTRICT_HUBS: DistrictCoord[] = [
  {
    id: 'all',
    nameAr: 'كافة مناطق 6 أكتوبر والشيخ زايد',
    nameEn: 'All West Cairo Districts',
    lat: 30.0050,
    lng: 30.9650,
    zoom: 12,
    descriptionAr: 'نظرة شاملة على كافة الوحدات المعروضة في غرب القاهرة'
  },
  {
    id: 'sheikh-zayed',
    nameAr: 'مدينة الشيخ زايد (أركان، بيفرلي هيلز)',
    nameEn: 'Sheikh Zayed City',
    lat: 30.0488,
    lng: 30.9850,
    zoom: 14,
    descriptionAr: 'أرقى مجمعات الشيخ زايد، المحور المركزي وميدان جهينة'
  },
  {
    id: 'north-expansions',
    nameAr: 'التوسعات الشمالية (ماونتن فيو، جراند هايتس)',
    nameEn: 'Northern Expansions',
    lat: 30.0260,
    lng: 30.9220,
    zoom: 14,
    descriptionAr: 'منطقة الفيلات والكمبوندات الحديثة شمال محور 26 يوليو'
  },
  {
    id: 'dahshur-palmhills',
    nameAr: 'وصلة دهشور وبالم هيلز (بادية، تشيل أوت)',
    nameEn: 'Dahshur Link & Palm Hills',
    lat: 30.0080,
    lng: 31.0080,
    zoom: 14,
    descriptionAr: 'امتداد وصلة دهشور، كمبوندات بالم هيلز وأوراسكوم'
  },
  {
    id: 'hadayek-october',
    nameAr: 'حدائق أكتوبر وأو ويست (حي الأشجار، صن كابيتال)',
    nameEn: 'Hadayek October & O West',
    lat: 29.9480,
    lng: 31.0250,
    zoom: 13,
    descriptionAr: 'قرب طريق الفيوم، مدينة زويل، والمتحف المصري الكبير'
  },
  {
    id: 'october-districts',
    nameAr: 'أحياء 6 أكتوبر (الحصري، الحي الأول إلى الـ12)',
    nameEn: '6th of October Urban Districts',
    lat: 29.9750,
    lng: 30.9400,
    zoom: 14,
    descriptionAr: 'قلب مدينة 6 أكتوبر، الحصري، المحور الخدمي وجامعة MSA'
  }
];

// Coordinate resolver based on compound name or unit area
function resolveUnitCoordinates(unit: Unit, index: number): [number, number] {
  const c = (unit.compound || '').toLowerCase();
  const a = (unit.area || '').toLowerCase();

  // Fine jitter so multiple units in same compound don't overlap completely
  const jitterLat = ((index % 7) - 3) * 0.0022;
  const jitterLng = (((index * 3) % 7) - 3) * 0.0024;

  if (c.includes('palm hills') || c.includes('بالم هيلز')) {
    return [30.0125 + jitterLat, 31.0090 + jitterLng];
  }
  if (c.includes('mountain view') || c.includes('ماونتن فيو') || c.includes('icity')) {
    return [30.0285 + jitterLat, 30.9250 + jitterLng];
  }
  if (c.includes('beverly hills') || c.includes('بيفرلي هيلز') || c.includes('sodic') || c.includes('سوديك')) {
    return [30.0620 + jitterLat, 30.9680 + jitterLng];
  }
  if (c.includes('badya') || c.includes('بادية')) {
    return [29.9680 + jitterLat, 30.8750 + jitterLng];
  }
  if (c.includes('o west') || c.includes('أوراسكوم') || c.includes('orascom')) {
    return [29.9720 + jitterLat, 31.0280 + jitterLng];
  }
  if (c.includes('zayed dunes') || c.includes('الربوة') || c.includes('karma') || c.includes('الكرمة')) {
    return [30.0380 + jitterLat, 30.9980 + jitterLng];
  }
  if (c.includes('sun capital') || c.includes('أشجار') || c.includes('ashgar')) {
    return [29.9450 + jitterLat, 31.0420 + jitterLng];
  }
  if (c.includes('grand heights') || c.includes('جراند هايتس')) {
    return [30.0320 + jitterLat, 30.9150 + jitterLng];
  }

  // District by area fallback
  if (a.includes('zayed') || a.includes('زايد')) {
    return [30.0450 + jitterLat, 30.9850 + jitterLng];
  }
  if (a.includes('hadayek') || a.includes('حدائق')) {
    return [29.9480 + jitterLat, 31.0250 + jitterLng];
  }
  
  // Default 6th of October central
  return [29.9820 + jitterLat, 30.9520 + jitterLng];
}

export const CompoundUnitMap: React.FC<CompoundUnitMapProps> = ({
  units,
  onSelectUnit,
  isArabic,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // States
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tileLayerType, setTileLayerType] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [selectedUnitPopup, setSelectedUnitPopup] = useState<Unit | null>(null);

  // Filtered Units for Map
  const filteredUnits = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return units.filter((u) => {
      // Search
      if (q) {
        const match = 
          u.id.toLowerCase().includes(q) ||
          u.compound.toLowerCase().includes(q) ||
          u.area.toLowerCase().includes(q) ||
          u.unitType.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Status
      if (selectedStatus !== 'all') {
        const s = u.status.toLowerCase();
        if (selectedStatus === 'available' && !s.includes('avail') && !s.includes('متاح')) return false;
        if (selectedStatus === 'reserved' && !s.includes('res') && !s.includes('حجز')) return false;
        if (selectedStatus === 'sold' && !s.includes('sold') && !s.includes('بيع')) return false;
      }

      // District filter
      if (selectedDistrict !== 'all') {
        const c = (u.compound || '').toLowerCase();
        const a = (u.area || '').toLowerCase();
        if (selectedDistrict === 'sheikh-zayed') {
          if (!a.includes('zayed') && !c.includes('beverly') && !c.includes('zayed') && !c.includes('karma')) return false;
        } else if (selectedDistrict === 'north-expansions') {
          if (!c.includes('mountain') && !c.includes('grand') && !c.includes('icity') && !c.includes('plaza')) return false;
        } else if (selectedDistrict === 'dahshur-palmhills') {
          if (!c.includes('palm hills') && !c.includes('badya') && !c.includes('chillout')) return false;
        } else if (selectedDistrict === 'hadayek-october') {
          if (!c.includes('o west') && !c.includes('sun') && !c.includes('ashgar') && !a.includes('hadayek')) return false;
        } else if (selectedDistrict === 'october-districts') {
          if (a.includes('zayed') || c.includes('palm hills') || c.includes('mountain')) return false;
        }
      }

      return true;
    });
  }, [units, searchQuery, selectedStatus, selectedDistrict]);

  // District unit counts
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = { all: units.length };
    DISTRICT_HUBS.forEach(d => {
      if (d.id === 'all') return;
      counts[d.id] = units.filter(u => {
        const c = (u.compound || '').toLowerCase();
        const a = (u.area || '').toLowerCase();
        if (d.id === 'sheikh-zayed') return a.includes('zayed') || c.includes('beverly') || c.includes('zayed') || c.includes('karma');
        if (d.id === 'north-expansions') return c.includes('mountain') || c.includes('grand') || c.includes('icity') || c.includes('plaza');
        if (d.id === 'dahshur-palmhills') return c.includes('palm hills') || c.includes('badya') || c.includes('chillout');
        if (d.id === 'hadayek-october') return c.includes('o west') || c.includes('sun') || c.includes('ashgar') || a.includes('hadayek');
        if (d.id === 'october-districts') return !a.includes('zayed') && !c.includes('palm hills') && !c.includes('mountain');
        return true;
      }).length;
    });
    return counts;
  }, [units]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create Map instance centered on 6th of October / Sheikh Zayed
    const map = L.map(mapContainerRef.current, {
      center: [30.0050, 30.9650],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Add Zoom Control on top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Attribution
    L.control.attribution({ position: 'bottomright', prefix: 'Leaflet | © OpenStreetMap contributors' }).addTo(map);

    // Layer group for markers
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer when tileLayerType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let maxZoom = 19;

    if (tileLayerType === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
    } else if (tileLayerType === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      maxZoom = 19;
    }

    L.tileLayer(tileUrl, {
      maxZoom,
      subdomains: 'abc'
    }).addTo(map);
  }, [tileLayerType]);

  // Render markers whenever filteredUnits change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    filteredUnits.forEach((unit, idx) => {
      const [lat, lng] = resolveUnitCoordinates(unit, idx);
      const isReserved = unit.status.toLowerCase().includes('res') || unit.status.toLowerCase().includes('حجز');
      const isSold = unit.status.toLowerCase().includes('sold') || unit.status.toLowerCase().includes('بيع');

      const pinBg = isSold ? 'rgb(239, 68, 68)' : isReserved ? 'rgb(245, 158, 11)' : 'rgb(16, 185, 129)';
      const priceK = unit.price ? `${(unit.price / 1000000).toFixed(1)}M` : '';

      // Custom DivIcon for Leaflet
      const iconHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background: ${pinBg}; color: white; padding: 2px 6px; border-radius: 9999px; font-weight: 800; font-size: 10px; font-family: monospace; border: 1.5px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); white-space: nowrap;">
            ${priceK || unit.id}
          </div>
          <div style="width: 10px; height: 10px; background: ${pinBg}; transform: rotate(45deg); margin-top: -5px; border-right: 1.5px solid white; border-bottom: 1.5px solid white;"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-marker',
        iconSize: [60, 30],
        iconAnchor: [30, 26]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Click Marker opens unit details
      marker.on('click', () => {
        setSelectedUnitPopup(unit);
        map.setView([lat, lng], 15, { animate: true });
      });

      markersGroup.addLayer(marker);
    });
  }, [filteredUnits]);

  // Pan to selected district
  const handleSelectDistrict = (districtId: string) => {
    setSelectedDistrict(districtId);
    const hub = DISTRICT_HUBS.find(h => h.id === districtId);
    if (hub && mapInstanceRef.current) {
      mapInstanceRef.current.setView([hub.lat, hub.lng], hub.zoom, { animate: true });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDark ? 'bg-surface border-border' : 'bg-white border-border'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-text'}`}>
                {isArabic ? 'خريطة العقارات الجغرافية الحقيقية' : 'Real Geographic Property Map'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 flex items-center gap-1 font-mono">
                <Sparkles className="w-2.5 h-2.5" />
                GPS / OSM Live
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-text-muted' : 'text-text-muted'}`}>
              {isArabic 
                ? 'استعراض جغرافي تفاعلي لمواقع العقارات والكمبوندات في 6 أكتوبر والشيخ زايد مع إمكانية التوجيه والملاحة' 
                : 'Interactive real West Cairo map with unit pins, pricing, and GPS navigation'}
            </p>
          </div>
        </div>

        {/* Map Tile Layers & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tile Layer Selector */}
          <div className={`p-1 rounded-xl border flex items-center text-xs font-semibold ${
            isDark ? 'bg-surface border-border' : 'bg-surface-raised border-border'
          }`}>
            <button
              onClick={() => setTileLayerType('streets')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                tileLayerType === 'streets' 
                  ? 'bg-blue-600 text-white shadow' 
                  : isDark ? 'text-text-muted hover:text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              {isArabic ? 'شوارع' : 'Streets'}
            </button>
            <button
              onClick={() => setTileLayerType('satellite')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                tileLayerType === 'satellite' 
                  ? 'bg-blue-600 text-white shadow' 
                  : isDark ? 'text-text-muted hover:text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              {isArabic ? 'قمر صناعي' : 'Satellite'}
            </button>
            <button
              onClick={() => setTileLayerType('dark')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                tileLayerType === 'dark' 
                  ? 'bg-blue-600 text-white shadow' 
                  : isDark ? 'text-text-muted hover:text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              {isArabic ? 'ليلي' : 'Night'}
            </button>
          </div>

          {/* Reset Zoom */}
          <button
            onClick={() => handleSelectDistrict('all')}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isDark ? 'bg-surface border-border text-text-muted hover:bg-surface-raised' : 'bg-surface-raised border-border text-text hover:bg-surface-raised'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{isArabic ? 'إعادة ضبط المنظور' : 'Reset View'}</span>
          </button>
        </div>
      </div>

      {/* District Filter Quick Bar */}
      <div className={`p-3 rounded-2xl border shadow-md flex items-center gap-2 overflow-x-auto ${
        isDark ? 'bg-surface border-border' : 'bg-white border-border'
      }`}>
        <span className="text-xs font-bold text-text-muted flex items-center gap-1 shrink-0 px-1">
          <MapPin className="w-3.5 h-3.5 text-blue-500" />
          <span>{isArabic ? 'تصفح حسب المنطقة:' : 'Districts:'}</span>
        </span>

        {DISTRICT_HUBS.map(hub => {
          const isSelected = selectedDistrict === hub.id;
          const count = districtCounts[hub.id] || 0;

          return (
            <button
              key={hub.id}
              onClick={() => handleSelectDistrict(hub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : isDark 
                  ? 'bg-surface border border-border text-text-muted hover:bg-surface-raised hover:text-white' 
                  : 'bg-surface-raised border border-border text-text hover:bg-surface-raised'
              }`}
            >
              <span>{isArabic ? hub.nameAr : hub.nameEn}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-surface-raised text-text-muted'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Map Canvas and Floating Card Overlay */}
      <div className="relative rounded-2xl border overflow-hidden shadow-2xl h-[560px] sm:h-[620px] bg-surface border-border">
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Search & Status Bar */}
        <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-80 z-[1000] flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 p-2 bg-surface backdrop-blur-md border border-border rounded-xl shadow-xl">
            <Search className="w-4 h-4 text-text-muted shrink-0 ml-1" />
            <input
              type="text"
              placeholder={isArabic ? 'بحث باسم الكمبوند أو الوحدة...' : 'Search compound or unit...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-surface backdrop-blur-md border border-border rounded-xl shadow-xl text-xs">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`flex-1 py-1 rounded-lg font-semibold text-center transition cursor-pointer ${
                selectedStatus === 'all' ? 'bg-blue-600 text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              {isArabic ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setSelectedStatus('available')}
              className={`flex-1 py-1 rounded-lg font-semibold text-center transition cursor-pointer ${
                selectedStatus === 'available' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              {isArabic ? 'متاح' : 'Available'}
            </button>
            <button
              onClick={() => setSelectedStatus('reserved')}
              className={`flex-1 py-1 rounded-lg font-semibold text-center transition cursor-pointer ${
                selectedStatus === 'reserved' ? 'bg-accent text-white' : 'text-accent hover:text-accent'
              }`}
            >
              {isArabic ? 'محجوز' : 'Reserved'}
            </button>
            <button
              onClick={() => setSelectedStatus('sold')}
              className={`flex-1 py-1 rounded-lg font-semibold text-center transition cursor-pointer ${
                selectedStatus === 'sold' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              {isArabic ? 'مباع' : 'Sold'}
            </button>
          </div>
        </div>

        {/* Legend Overlay at Bottom Right */}
        <div className="absolute bottom-4 left-4 z-[1000] p-2.5 rounded-xl bg-surface backdrop-blur-md border border-border text-[11px] font-semibold text-text-muted shadow-xl space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{isArabic ? 'وحدات متاحة للبيع' : 'Available'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span>{isArabic ? 'وحدات محجوزة' : 'Reserved'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>{isArabic ? 'وحدات تم بيعها' : 'Sold Out'}</span>
          </div>
          <div className="text-[10px] text-text-muted pt-1 border-t border-border font-mono">
            {filteredUnits.length} {isArabic ? 'وحدة معروضة بالخريطة' : 'units rendered'}
          </div>
        </div>

        {/* Selected Unit Popup / Card Overlay */}
        {selectedUnitPopup && (
          <div className="absolute bottom-4 right-4 z-[1000] w-80 sm:w-96 rounded-2xl bg-surface backdrop-blur-md border border-border shadow-2xl p-4 text-xs text-white space-y-3 animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {selectedUnitPopup.unitType}
                </span>
                <h3 className="font-bold text-sm text-white mt-1">
                  {selectedUnitPopup.compound}
                </h3>
                <span className="text-[11px] text-text-muted flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-accent" />
                  <span>{selectedUnitPopup.area}</span>
                  <span className="font-mono text-accent font-bold">[{selectedUnitPopup.id}]</span>
                </span>
              </div>

              <button
                onClick={() => setSelectedUnitPopup(null)}
                className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-surface-raised transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price & specs */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface border border-border text-center font-mono">
              <div>
                <span className="text-[9px] text-text-muted block font-sans">{isArabic ? 'السعر' : 'Price'}</span>
                <strong className="text-emerald-400 text-xs font-bold">
                  {selectedUnitPopup.price ? `${(selectedUnitPopup.price / 1000000).toFixed(2)}M` : '-'}
                </strong>
              </div>
              <div>
                <span className="text-[9px] text-text-muted block font-sans">{isArabic ? 'المساحة' : 'Area'}</span>
                <strong className="text-white text-xs">{selectedUnitPopup.size} م²</strong>
              </div>
              <div>
                <span className="text-[9px] text-text-muted block font-sans">{isArabic ? 'الغرف' : 'Beds'}</span>
                <strong className="text-white text-xs">{selectedUnitPopup.beds || 3} غرف</strong>
              </div>
            </div>

            {/* Actions: View Details, Google Maps Direction, WhatsApp */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                onClick={() => {
                  onSelectUnit(selectedUnitPopup);
                  setSelectedUnitPopup(null);
                }}
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-center transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تفاصيل الوحدة' : 'View Unit'}</span>
              </button>

              <button
                onClick={() => {
                  const query = encodeURIComponent(`${selectedUnitPopup.compound} ${selectedUnitPopup.area} Egypt`);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                }}
                className="px-3 py-1.5 bg-surface-raised hover:bg-surface-raised text-accent border border-border font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                title={isArabic ? 'فتح الملاحة في Google Maps' : 'Open in Google Maps'}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>GPS</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompoundUnitMap;
