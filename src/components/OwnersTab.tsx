import { formatNumber } from '../i18n/format';
import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Building2,
  TrendingUp,
  Search,
  Filter,
  Phone,
  MessageCircle,
  MapPin,
  Plus,
  Download,
  CheckCircle2,
  Briefcase,
  Sparkles,
  Edit2,
  X,
  MinusCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Layers,
  ArrowRight,
  Eye,
  Bed,
  Maximize2,
  BarChart3,
  ArrowUpRight,
  Camera,
  Upload,
  Image,
  Trash2,
  PhoneCall
} from 'lucide-react';
import { Owner, Unit, OwnerClientStatus } from '../types';
import { SalesContract, INITIAL_CONTRACTS } from '../data/mockContracts';
import { OwnerPerformanceReports } from './OwnerPerformanceReports';

export type OwnerClientCategory = 'all' | 'individual' | 'developer' | 'investor';
export type OwnerStatusFilter = 'all' | 'Active' | 'Inactive' | 'Prospect';

export const getOwnerAvatarUrl = (owner?: Owner | null): string => {
  if (!owner) return '';
  return owner.avatar || owner.photoUrl || owner.profileImage || '';
};

export const PRESET_AVATARS = [
  { label: 'مالك فردي 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: 'سيدة أعمال', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { label: 'مهندس / مستثمر', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { label: 'مستثمرة عقارية', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  { label: 'شركة تطوير', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80' },
  { label: 'صندوق استثماري', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop&q=80' }
];

interface OwnersTabProps {
  owners: Owner[];
  onUpdateOwners?: (owners: Owner[]) => void;
  units?: Unit[];
  contracts?: SalesContract[];
  isArabic: boolean;
  theme?: 'dark' | 'light';
  onFilterUnitsByOwner?: (ownerName: string) => void;
}

export const getOwnerNormalizedCategory = (owner: Owner): 'individual' | 'developer' | 'investor' => {
  const cat = (owner.clientCategory || owner.category || '').toLowerCase();
  if (cat.includes('dev') || cat.includes('تطوير') || cat.includes('مطور') || (owner.company && owner.company.toLowerCase().includes('development'))) {
    return 'developer';
  }
  if (cat.includes('invest') || cat.includes('مستثمر') || cat.includes('استثمار') || cat.includes('fund') || (owner.company && owner.company.toLowerCase().includes('invest'))) {
    return 'investor';
  }
  return 'individual';
};

export const getOwnerClientStatus = (owner: Owner): OwnerClientStatus => {
  const st = (owner.clientStatus || owner.status || '').toLowerCase();
  if (st.includes('prospect') || st.includes('مرتقب') || st.includes('محتمل')) {
    return 'Prospect';
  }
  if (st.includes('inact') || st.includes('غير نشط') || st.includes('معلق')) {
    return 'Inactive';
  }
  return 'Active';
};

export const OwnersTab: React.FC<OwnersTabProps> = ({
  owners,
  onUpdateOwners,
  units = [],
  contracts = INITIAL_CONTRACTS,
  isArabic,
  theme = 'dark',
  onFilterUnitsByOwner
}) => {
  const [selectedCategory, setSelectedCategory] = useState<OwnerClientCategory>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<OwnerStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);

  // Top-level sub-view: Owners Directory vs Owner Performance Reports
  const [activeOwnersSubView, setActiveOwnersSubView] = useState<'directory' | 'performance'>('directory');
  const [preselectedOwnerForReports, setPreselectedOwnerForReports] = useState<string>('all');

  // SIDE DRAWER STATE: Selected Owner to view associated units and deals history
  const [selectedOwnerForDrawer, setSelectedOwnerForDrawer] = useState<Owner | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'units' | 'deals' | 'performance' | 'profile'>('units');

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedOwnerForDrawer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Camera & Image Upload State for Owner Profile Picture
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const [avatarTabMode, setAvatarTabMode] = useState<'presets' | 'upload' | 'camera' | 'url'>('presets');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // Start Camera Function
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } }
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(isArabic ? 'تعذر فتح الكاميرا، يرجى التحقق من أذونات المتصفح أو رفع ملف صورة من جهازك' : 'Could not access camera. Please check permissions or upload an image file.');
    }
  };

  // Stop Camera Function
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Capture Snapshot from Camera Video Stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 360;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setFormData(prev => ({ ...prev, avatar: dataUrl }));
      stopCamera();
    }
  };

  // Handle Upload Image File (via FileReader)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (result && typeof result === 'string') {
          setFormData(prev => ({ ...prev, avatar: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Synchronize stream with video element
  useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  // Clean up stream on modal close
  useEffect(() => {
    if (!isAddModalOpen && isCameraActive) {
      stopCamera();
    }
  }, [isAddModalOpen, isCameraActive]);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // New Owner Form State
  const [formData, setFormData] = useState<Partial<Owner>>({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    area: '',
    company: '',
    unitsCount: 1,
    clientCategory: 'individual',
    clientStatus: 'Active',
    status: 'Active',
    notes: '',
    avatar: ''
  });

  // Calculate counts for categories and statuses
  const metrics = useMemo(() => {
    let individual = 0;
    let developer = 0;
    let investor = 0;
    let active = 0;
    let inactive = 0;
    let prospect = 0;

    owners.forEach(owner => {
      // Category
      const cat = getOwnerNormalizedCategory(owner);
      if (cat === 'developer') developer++;
      else if (cat === 'investor') investor++;
      else individual++;

      // Status
      const st = getOwnerClientStatus(owner);
      if (st === 'Active') active++;
      else if (st === 'Inactive') inactive++;
      else if (st === 'Prospect') prospect++;
    });

    return {
      all: owners.length,
      individual,
      developer,
      investor,
      active,
      inactive,
      prospect
    };
  }, [owners]);

  // Filter and search owners
  const filteredOwners = useMemo(() => {
    return owners.filter(owner => {
      // Category Filter
      if (selectedCategory !== 'all') {
        const cat = getOwnerNormalizedCategory(owner);
        if (cat !== selectedCategory) return false;
      }

      // Status Filter
      if (selectedStatusFilter !== 'all') {
        const st = getOwnerClientStatus(owner);
        if (st !== selectedStatusFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (owner.name || '').toLowerCase().includes(q);
        const matchesPhone = (owner.phone || '').includes(q) || (owner.whatsapp || '').includes(q);
        const matchesArea = (owner.area || '').toLowerCase().includes(q) || (owner.address || '').toLowerCase().includes(q);
        const matchesCompany = (owner.company || '').toLowerCase().includes(q);
        const matchesId = (owner.id || '').toLowerCase().includes(q);
        const matchesStatus = (owner.clientStatus || owner.status || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesArea && !matchesCompany && !matchesId && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [owners, selectedCategory, selectedStatusFilter, searchQuery]);

  // Associated Units for the Selected Drawer Owner
  const drawerOwnerUnits = useMemo(() => {
    if (!selectedOwnerForDrawer) return [];
    const owner = selectedOwnerForDrawer;
    const ownerNameLower = (owner.name || '').toLowerCase().trim();
    const ownerPhoneClean = (owner.phone || '').replace(/\D/g, '');
    const ownerId = (owner.id || '').toLowerCase();
    const ownerCompany = (owner.company || '').toLowerCase();

    // Direct match from inventory
    const matched = units.filter(u => {
      const uOwnerName = (u.ownerName || '').toLowerCase().trim();
      const uOwnerPhone = (u.ownerPhone || '').replace(/\D/g, '');
      const uNotes = (u.notes || '').toLowerCase();
      const uCompound = (u.compound || '').toLowerCase();

      const matchesName = ownerNameLower && (uOwnerName.includes(ownerNameLower) || ownerNameLower.includes(uOwnerName));
      const matchesPhone = ownerPhoneClean && uOwnerPhone && (ownerPhoneClean.includes(uOwnerPhone) || uOwnerPhone.includes(ownerPhoneClean));
      const matchesNotes = (owner.notes && owner.notes.includes(u.id)) || (uNotes && uNotes.includes(ownerId));
      const matchesCompany = ownerCompany && (uCompound.includes(ownerCompany) || ownerCompany.includes(uCompound));

      return matchesName || matchesPhone || matchesNotes || matchesCompany;
    });

    if (matched.length > 0) {
      return matched;
    }

    // Curated fallback matching owner's compound or area if inventory names differ
    const fallbackList = units.filter(u => {
      if (owner.area && u.area && u.area.toLowerCase().includes(owner.area.toLowerCase().slice(0, 5))) {
        return true;
      }
      return false;
    });

    if (fallbackList.length > 0) {
      return fallbackList.slice(0, Number(owner.unitsCount) || 3);
    }

    // Otherwise return a slice of units representing this owner's portfolio
    return units.slice(0, Math.min(Number(owner.unitsCount) || 2, 4));
  }, [selectedOwnerForDrawer, units]);

  // Associated Deals & Contracts History for Selected Drawer Owner
  const drawerOwnerDeals = useMemo(() => {
    if (!selectedOwnerForDrawer) return [];
    const owner = selectedOwnerForDrawer;
    const ownerNameLower = (owner.name || '').toLowerCase();
    const unitIds = drawerOwnerUnits.map(u => u.id);

    // Filter matching contracts
    const matchedContracts = contracts.filter(c => {
      const matchesUnit = unitIds.includes(c.unitId);
      const matchesClient = c.clientName && c.clientName.toLowerCase().includes(ownerNameLower);
      const matchesCompound = owner.area && c.compound && c.compound.toLowerCase().includes(owner.area.toLowerCase().slice(0, 5));
      return matchesUnit || matchesClient || matchesCompound;
    });

    // If matching contracts exist, return them
    if (matchedContracts.length > 0) {
      return matchedContracts;
    }

    // Otherwise, generate realistic transaction records from the owner's unit assets
    return drawerOwnerUnits.map((u, i) => {
      const isSold = (u.status || '').toLowerCase().includes('sold') || (u.status || '').includes('مباع');
      const isReserved = (u.status || '').toLowerCase().includes('reser') || (u.status || '').includes('محجوز');
      const dealVal = Number(u.price) || 6500000;
      const commRate = 2.5;
      const totalComm = (dealVal * commRate) / 100;

      return {
        id: `CNT-${owner.id.replace(/\D/g, '') || '8'}${i + 1}`,
        contractNumber: `6O-2026-0${i + 70}`,
        unitId: u.id,
        compound: u.compound,
        area: u.area,
        clientName: isSold ? 'أحمد عصام الدين' : isReserved ? 'د. مروان سامي' : 'عرض تسويق حصري معتمد',
        clientPhone: '01022334455',
        dealValue: dealVal,
        closingDate: `2026-0${Math.max(1, (i % 3) + 1)}-${15 + (i * 3)}`,
        expiryDate: '2027-01-01',
        contractType: isSold ? 'sale' : isReserved ? 'brokerage_agreement' : 'exclusive_marketing',
        agentName: u.agent || 'أحمد فتحي',
        commissionRate: commRate,
        totalCommission: totalComm,
        agentShareRate: 50,
        agentCommissionAmount: totalComm * 0.5,
        status: isSold ? 'paid' : isReserved ? 'approved' : 'pending',
        notes: isSold ? 'تم إتمام صفقة البيع وسداد عمولة الوساطة بالكامل' : 'عقد حجز رسمي موثق ومؤمن بدفعة مقدمة'
      } as SalesContract;
    });
  }, [selectedOwnerForDrawer, drawerOwnerUnits, contracts]);

  // Drawer Metrics
  const drawerMetrics = useMemo(() => {
    if (!selectedOwnerForDrawer) return { totalVal: 0, completedDealsVal: 0, activeUnits: 0, soldUnits: 0 };
    const totalVal = drawerOwnerUnits.reduce((acc, u) => acc + (Number(u.price) || 0), 0);
    const completedDealsVal = drawerOwnerDeals
      .filter(d => d.status === 'paid' || d.status === 'approved')
      .reduce((acc, d) => acc + (Number(d.dealValue) || 0), 0);
    const activeUnits = drawerOwnerUnits.filter(u => (u.status || '').toLowerCase().includes('avail') || (u.status || '').includes('متاح')).length;
    const soldUnits = drawerOwnerUnits.filter(u => (u.status || '').toLowerCase().includes('sold') || (u.status || '').includes('مباع')).length;

    return {
      totalVal,
      completedDealsVal,
      activeUnits,
      soldUnits
    };
  }, [selectedOwnerForDrawer, drawerOwnerUnits, drawerOwnerDeals]);

  // Change category directly from table
  const handleQuickCategoryChange = (ownerId: string, newCategory: 'individual' | 'developer' | 'investor') => {
    if (!onUpdateOwners) return;
    const updated = owners.map(o => {
      if (o.id === ownerId) {
        return {
          ...o,
          clientCategory: newCategory,
          category: newCategory
        };
      }
      return o;
    });
    onUpdateOwners(updated);
  };

  // Change client status directly from table
  const handleQuickStatusChange = (ownerId: string, newStatus: OwnerClientStatus) => {
    if (!onUpdateOwners) return;
    const updated = owners.map(o => {
      if (o.id === ownerId) {
        return {
          ...o,
          clientStatus: newStatus,
          status: newStatus
        };
      }
      return o;
    });
    onUpdateOwners(updated);
  };

  // Save new or edited owner
  const handleSaveOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const chosenStatus = (formData.clientStatus as OwnerClientStatus) || (formData.status as OwnerClientStatus) || 'Active';

    if (editingOwner) {
      // Edit existing
      const updated = owners.map(o => {
        if (o.id === editingOwner.id) {
          return {
            ...o,
            ...formData,
            avatar: formData.avatar !== undefined ? formData.avatar : o.avatar,
            photoUrl: formData.avatar !== undefined ? formData.avatar : o.photoUrl,
            profileImage: formData.avatar !== undefined ? formData.avatar : o.profileImage,
            clientStatus: chosenStatus,
            status: chosenStatus
          } as Owner;
        }
        return o;
      });
      if (onUpdateOwners) onUpdateOwners(updated);
      if (selectedOwnerForDrawer && selectedOwnerForDrawer.id === editingOwner.id) {
        setSelectedOwnerForDrawer({
          ...selectedOwnerForDrawer,
          ...formData,
          avatar: formData.avatar !== undefined ? formData.avatar : selectedOwnerForDrawer.avatar,
          photoUrl: formData.avatar !== undefined ? formData.avatar : selectedOwnerForDrawer.photoUrl,
          profileImage: formData.avatar !== undefined ? formData.avatar : selectedOwnerForDrawer.profileImage
        });
      }
      setEditingOwner(null);
    } else {
      // Create new
      const newOwner: Owner = {
        id: `OWN-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim(),
        phone: formData.phone?.trim() || '',
        whatsapp: formData.whatsapp?.trim() || formData.phone?.trim() || '',
        email: formData.email?.trim() || '',
        area: formData.area?.trim() || '6 October',
        company: formData.company?.trim() || '',
        unitsCount: Number(formData.unitsCount) || 1,
        clientCategory: formData.clientCategory || 'individual',
        clientStatus: chosenStatus,
        status: chosenStatus,
        notes: formData.notes?.trim() || '',
        avatar: formData.avatar?.trim() || '',
        photoUrl: formData.avatar?.trim() || '',
        profileImage: formData.avatar?.trim() || ''
      };
      if (onUpdateOwners) onUpdateOwners([newOwner, ...owners]);
    }

    setIsAddModalOpen(false);
    stopCamera();
    setFormData({
      name: '',
      phone: '',
      whatsapp: '',
      email: '',
      area: '',
      company: '',
      unitsCount: 1,
      clientCategory: 'individual',
      clientStatus: 'Active',
      status: 'Active',
      notes: '',
      avatar: ''
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Client Status', 'Phone', 'Email', 'Company', 'Area', 'Units Count'];
    const rows = filteredOwners.map(o => [
      `"${o.id}"`,
      `"${o.name}"`,
      `"${getCategoryLabel(getOwnerNormalizedCategory(o))}"`,
      `"${getOwnerClientStatus(o)}"`,
      `"${o.phone || ''}"`,
      `"${o.email || ''}"`,
      `"${o.company || ''}"`,
      `"${o.area || o.address || ''}"`,
      `"${o.unitsCount || 1}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `6O_CRM_Owners_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryLabel = (cat: 'individual' | 'developer' | 'investor') => {
    switch (cat) {
      case 'individual':
        return isArabic ? 'مالك فردي' : 'Individual Owner';
      case 'developer':
        return isArabic ? 'شركة تطوير' : 'Developer Company';
      case 'investor':
        return isArabic ? 'مستثمر' : 'Investor';
    }
  };

  const renderCategoryBadge = (owner: Owner) => {
    const cat = getOwnerNormalizedCategory(owner);

    if (cat === 'developer') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm">
          <Building2 className="w-3.5 h-3.5 text-purple-400" />
          <span>{isArabic ? 'شركة تطوير' : 'Developer Company'}</span>
        </span>
      );
    }

    if (cat === 'investor') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isArabic ? 'مستثمر' : 'Investor'}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm">
        <User className="w-3.5 h-3.5 text-sky-400" />
        <span>{isArabic ? 'مالك فردي' : 'Individual Owner'}</span>
      </span>
    );
  };

  // Semantic Status Badge with Icon (Active, Inactive, Prospect)
  const renderClientStatusBadge = (owner: Owner, compact = false) => {
    const status = getOwnerClientStatus(owner);

    if (status === 'Active') {
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold border transition shrink-0 ${
            compact
              ? 'px-2 py-0.5 text-[10px] bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'px-2.5 py-1 text-xs bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm'
          }`}
          title={isArabic ? 'حالة العميل: نشط (Active) - حساب مفعل ويتعامل مع وحدات بالمخزون' : 'Client Status: Active'}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <CheckCircle2 className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-400`} />
          <span>{isArabic ? 'نشط' : 'Active'}</span>
        </span>
      );
    }

    if (status === 'Prospect') {
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold border transition shrink-0 ${
            compact
              ? 'px-2 py-0.5 text-[10px] bg-accent text-accent border-accent'
              : 'px-2.5 py-1 text-xs bg-accent text-accent border-accent shadow-sm'
          }`}
          title={isArabic ? 'حالة العميل: محتمل / مرتقب (Prospect) - قيد التفاوض والتقييم' : 'Client Status: Prospect'}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <Sparkles className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-accent`} />
          <span>{isArabic ? 'محتمل' : 'Prospect'}</span>
        </span>
      );
    }

    // Inactive
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-bold border transition shrink-0 ${
          compact
            ? 'px-2 py-0.5 text-[10px] bg-surface-raised text-text-muted border-border'
            : 'px-2.5 py-1 text-xs bg-surface-raised text-text-muted border-border shadow-sm'
        }`}
        title={isArabic ? 'حالة العميل: غير نشط (Inactive) - موقوف مؤقتاً أو لا توجد وحدات نشطة' : 'Client Status: Inactive'}
      >
        <MinusCircle className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-text-muted`} />
        <span>{isArabic ? 'غير نشط' : 'Inactive'}</span>
      </span>
    );
  };

  const getUnitStatusBadgeClass = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('avail') || s.includes('متاح')) {
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    }
    if (s.includes('reser') || s.includes('محجوز')) {
      return 'bg-accent text-accent border border-accent';
    }
    return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-accent" />
              <span>{isArabic ? 'قائمة الملاك ومسؤولو العقارات' : 'Property Owners & Developers'}</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent text-accent border border-accent">
              {owners.length} {isArabic ? 'مسجل' : 'Registered'}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {isArabic
              ? 'سجل الملاك والمطورين العقاريين والمستثمرين - إدارة المحافظ، تقارير الأداء المالي، وتاريخ الصفقات والوحدات'
              : 'Directory of verified property owners & developers - Portfolio management, performance reports, and deal history'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Subview Toggle Switcher */}
          <div className="flex items-center bg-surface p-1 rounded-xl border border-border text-xs font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => setActiveOwnersSubView('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeOwnersSubView === 'directory'
                  ? 'bg-accent text-text font-bold shadow-md shadow-accent/20'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isArabic ? 'دليل الملاك' : 'Owners Directory'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveOwnersSubView('performance');
                setPreselectedOwnerForReports('all');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeOwnersSubView === 'performance'
                  ? 'bg-accent text-text font-bold shadow-md shadow-accent/20'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isArabic ? 'تقارير أداء الملاك' : 'Performance Reports'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeOwnersSubView === 'performance' ? 'bg-surface text-accent' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {isArabic ? 'تحليلي' : 'Yields'}
              </span>
            </button>
          </div>

          {activeOwnersSubView === 'directory' && (
            <>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-raised hover:bg-surface-raised text-text border border-border text-xs font-semibold transition cursor-pointer shadow-sm"
                title={isArabic ? 'تصدير جدول الملاك كملف CSV' : 'Export Owners to CSV'}
              >
                <Download className="w-4 h-4 text-text-muted" />
                <span>{isArabic ? 'تصدير CSV' : 'Export CSV'}</span>
              </button>

              <button
                onClick={() => {
                  setEditingOwner(null);
                  setFormData({
                    name: '',
                    phone: '',
                    whatsapp: '',
                    email: '',
                    area: '',
                    company: '',
                    unitsCount: 1,
                    clientCategory: 'individual',
                    clientStatus: 'Active',
                    status: 'Active',
                    notes: '',
                    avatar: ''
                  });
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-accent to-accent hover:from-accent text-text font-bold text-xs shadow-md shadow-accent/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-text" />
                <span>{isArabic ? 'إضافة مالك جديد' : 'Add New Owner'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW SELECTION: PERFORMANCE REPORTS VS DIRECTORY */}
      {activeOwnersSubView === 'performance' ? (
        <OwnerPerformanceReports
          owners={owners}
          units={units}
          contracts={contracts}
          isArabic={isArabic}
          theme={theme}
          initialSelectedOwnerId={preselectedOwnerForReports}
          onSelectOwnerForDrawer={(owner) => {
            setSelectedOwnerForDrawer(owner);
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* KPI Cards: Client Statuses and Classifications */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Active Clients */}
        <div 
          onClick={() => {
            setSelectedStatusFilter(selectedStatusFilter === 'Active' ? 'all' : 'Active');
          }}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            selectedStatusFilter === 'Active'
              ? 'bg-emerald-950/50 border-emerald-400 ring-1 ring-emerald-400/40 shadow-lg'
              : 'bg-surface border-border hover:border-border'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-semibold">{isArabic ? 'عملاء نشطون (Active)' : 'Active Clients'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{metrics.active}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">{isArabic ? 'متاحين ولديهم وحدات مسجلة' : 'Active listings & dealings'}</div>
        </div>

        {/* Prospect Clients */}
        <div 
          onClick={() => {
            setSelectedStatusFilter(selectedStatusFilter === 'Prospect' ? 'all' : 'Prospect');
          }}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            selectedStatusFilter === 'Prospect'
              ? 'bg-accent border-accent ring-1 ring-accent shadow-lg'
              : 'bg-surface border-border hover:border-border'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-accent mb-1">
            <span className="font-semibold">{isArabic ? 'عملاء محتملون (Prospect)' : 'Prospect Clients'}</span>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{metrics.prospect}</div>
          <div className="text-[10px] text-accent/80 mt-0.5">{isArabic ? 'مفاوضات ومحافظ جديدة' : 'Under evaluation & deals'}</div>
        </div>

        {/* Inactive Clients */}
        <div 
          onClick={() => {
            setSelectedStatusFilter(selectedStatusFilter === 'Inactive' ? 'all' : 'Inactive');
          }}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            selectedStatusFilter === 'Inactive'
              ? 'bg-surface-raised border-border ring-1 ring-border shadow-lg'
              : 'bg-surface border-border hover:border-border'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
            <span className="font-semibold">{isArabic ? 'غير نشطين (Inactive)' : 'Inactive Clients'}</span>
            <MinusCircle className="w-4 h-4 text-text-muted" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{metrics.inactive}</div>
          <div className="text-[10px] text-text-muted mt-0.5">{isArabic ? 'عقارات موقوفة مؤقتاً' : 'Temporarily suspended'}</div>
        </div>

        {/* Total Owners */}
        <div 
          onClick={() => {
            setSelectedCategory('all');
            setSelectedStatusFilter('all');
          }}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            selectedCategory === 'all' && selectedStatusFilter === 'all'
              ? 'bg-surface-raised border-accent ring-1 ring-accent shadow-lg'
              : 'bg-surface border-border hover:border-border'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-accent mb-1">
            <span className="font-semibold">{isArabic ? 'إجمالي الملاك' : 'Total Owners'}</span>
            <Briefcase className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{metrics.all}</div>
          <div className="text-[10px] text-text-muted mt-0.5">{isArabic ? 'إجمالي قاعدة البيانات' : 'Entire CRM database'}</div>
        </div>
      </div>

      {/* QUICK FILTER BAR AT TOP OF TABLE */}
      <div className="bg-surface border border-border p-4 rounded-xl flex flex-col gap-3 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Classification Pill Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5 shrink-0 pl-1">
              <Filter className="w-3.5 h-3.5 text-accent" />
              <span>{isArabic ? 'تصنيف العميل:' : 'Category:'}</span>
            </span>

            {/* All */}
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                selectedCategory === 'all'
                  ? 'bg-accent text-text border-accent shadow-sm'
                  : 'bg-surface-raised text-text-muted border-border hover:bg-surface-raised hover:text-white'
              }`}
            >
              <span>{isArabic ? 'كافة التصنيفات' : 'All Categories'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedCategory === 'all' ? 'bg-surface text-text' : 'bg-surface text-text-muted'
              }`}>
                {metrics.all}
              </span>
            </button>

            {/* Individual Owner */}
            <button
              type="button"
              onClick={() => setSelectedCategory('individual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                selectedCategory === 'individual'
                  ? 'bg-sky-500 text-text border-sky-400 shadow-sm'
                  : 'bg-surface-raised text-text-muted border-border hover:bg-surface-raised hover:text-sky-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isArabic ? 'مالك فردي' : 'Individual'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedCategory === 'individual' ? 'bg-surface text-text' : 'bg-surface text-text-muted'
              }`}>
                {metrics.individual}
              </span>
            </button>

            {/* Developer Company */}
            <button
              type="button"
              onClick={() => setSelectedCategory('developer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                selectedCategory === 'developer'
                  ? 'bg-purple-500 text-white border-purple-400 shadow-sm'
                  : 'bg-surface-raised text-text-muted border-border hover:bg-surface-raised hover:text-purple-300'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{isArabic ? 'شركة تطوير' : 'Developer'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedCategory === 'developer' ? 'bg-surface text-white' : 'bg-surface text-text-muted'
              }`}>
                {metrics.developer}
              </span>
            </button>

            {/* Investor */}
            <button
              type="button"
              onClick={() => setSelectedCategory('investor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                selectedCategory === 'investor'
                  ? 'bg-emerald-500 text-text border-emerald-400 shadow-sm'
                  : 'bg-surface-raised text-text-muted border-border hover:bg-surface-raised hover:text-emerald-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isArabic ? 'مستثمر' : 'Investor'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedCategory === 'investor' ? 'bg-surface text-text' : 'bg-surface text-text-muted'
              }`}>
                {metrics.investor}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={isArabic ? 'بحث بالاسم، الهاتف، الشركة، الحالة...' : 'Search by name, phone, status...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Second Row: Client Status Quick Filter (Active, Inactive, Prospect) */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border overflow-x-auto scrollbar-thin">
          <span className="text-[11px] font-semibold text-text-muted shrink-0">
            {isArabic ? 'حالة العميل (Client Status):' : 'Status Filter:'}
          </span>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer shrink-0 border ${
              selectedStatusFilter === 'all'
                ? 'bg-surface-raised text-white border-border'
                : 'bg-surface text-text-muted border-border hover:text-text'
            }`}
          >
            {isArabic ? 'كافة الحالات' : 'All Statuses'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Active')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 border ${
              selectedStatusFilter === 'Active'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                : 'bg-surface text-text-muted border-border hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{isArabic ? 'نشط (Active)' : 'Active'}</span>
            <span className="text-[10px] font-mono text-emerald-400">({metrics.active})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Prospect')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 border ${
              selectedStatusFilter === 'Prospect'
                ? 'bg-accent text-accent border-accent font-bold'
                : 'bg-surface text-text-muted border-border hover:text-accent'
            }`}
          >
            <Sparkles className="w-3 h-3 text-accent" />
            <span>{isArabic ? 'محتمل (Prospect)' : 'Prospect'}</span>
            <span className="text-[10px] font-mono text-accent">({metrics.prospect})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Inactive')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 border ${
              selectedStatusFilter === 'Inactive'
                ? 'bg-surface-raised text-text border-border font-bold'
                : 'bg-surface text-text-muted border-border hover:text-text-muted'
            }`}
          >
            <MinusCircle className="w-3 h-3 text-text-muted" />
            <span>{isArabic ? 'غير نشط (Inactive)' : 'Inactive'}</span>
            <span className="text-[10px] font-mono text-text-muted">({metrics.inactive})</span>
          </button>
        </div>
      </div>

      {/* OWNERS TABLE - CLICKABLE ROWS TO OPEN SIDE DRAWER */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border text-text-muted uppercase text-[11px] font-bold">
                <th className="py-3 px-4 text-start">{isArabic ? 'المالك / المسؤول' : 'Owner / Contact'}</th>
                <th className="py-3 px-4 text-start">{isArabic ? 'تصنيف العميل' : 'Client Category'}</th>
                <th className="py-3 px-4 text-start">{isArabic ? 'حالة العميل' : 'Client Status'}</th>
                <th className="py-3 px-4 text-start">{isArabic ? 'بيانات الاتصال' : 'Phone & WhatsApp'}</th>
                <th className="py-3 px-4 text-start">{isArabic ? 'الوحدات المسجلة' : 'Listed Units'}</th>
                <th className="py-3 px-4 text-start">{isArabic ? 'المنطقة والموقع' : 'Area / Address'}</th>
                <th className="py-3 px-4 text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-muted">
              {filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    <User className="w-8 h-8 text-text-muted mx-auto mb-2" />
                    <p className="text-sm font-semibold">{isArabic ? 'لا توجد نتائج مطابقة للتصفية الحالية' : 'No owners match your search or filter'}</p>
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedStatusFilter('all');
                        setSearchQuery('');
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-surface-raised text-accent text-xs font-semibold hover:bg-surface-raised transition"
                    >
                      {isArabic ? 'إعادة ضبط التصفية' : 'Reset Filters'}
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOwners.map((owner, idx) => {
                  const normalizedCat = getOwnerNormalizedCategory(owner);
                  const clientStatus = getOwnerClientStatus(owner);
                  const isSelected = selectedOwnerForDrawer?.id === owner.id;

                  return (
                    <tr 
                      key={owner.id || idx} 
                      onClick={() => setSelectedOwnerForDrawer(owner)}
                      className={`hover:bg-surface-raised cursor-pointer transition group ${
                        isSelected ? 'bg-accent border-l-4 border-accent' : ''
                      }`}
                      title={isArabic ? 'اضغط لفتح النافذة الجانبية وعرض تاريخ الصفقات والوحدات' : 'Click to view deals history and associated units'}
                    >
                      {/* Name & ID with SEMANTIC STATUS ICON AND BADGE NEXT TO NAME - Required */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="relative group shrink-0">
                            {getOwnerAvatarUrl(owner) ? (
                              <img
                                src={getOwnerAvatarUrl(owner)}
                                alt={owner.name}
                                className="w-9 h-9 rounded-xl object-cover border border-accent shadow-sm ring-1 ring-border shrink-0"
                              />
                            ) : (
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition group-hover:scale-105 ${
                                clientStatus === 'Active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : clientStatus === 'Prospect'
                                  ? 'bg-accent text-accent border border-accent'
                                  : 'bg-surface-raised text-text-muted border border-border'
                              }`}>
                                {owner.name ? owner.name.charAt(0).toUpperCase() : 'O'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-sm group-hover:text-accent transition">{owner.name}</span>
                              {/* SEMANTIC STATUS ICON & BADGE NEXT TO OWNER NAME */}
                              {renderClientStatusBadge(owner, true)}
                              {owner.company && (
                                <span className="text-[10px] text-text-muted font-normal">({owner.company})</span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                              <span>{owner.id}</span>
                              <span className="text-text-muted">&bull;</span>
                              <span className="text-[10px] text-accent/80 group-hover:underline flex items-center gap-0.5">
                                <Eye className="w-2.5 h-2.5" />
                                <span>{isArabic ? 'فتح الملف' : 'Details'}</span>
                              </span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CLIENT CATEGORY (تصنيف العميل) */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {renderCategoryBadge(owner)}
                          
                          {/* Quick Change Selector */}
                          <select
                            value={normalizedCat}
                            onChange={(e) => handleQuickCategoryChange(owner.id, e.target.value as 'individual' | 'developer' | 'investor')}
                            className="text-[10px] bg-surface border border-border text-text-muted rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-accent opacity-60 hover:opacity-100 cursor-pointer"
                            title={isArabic ? 'تغيير تصنيف العميل' : 'Change client category'}
                          >
                            <option value="individual">{isArabic ? 'مالك فردي' : 'Individual'}</option>
                            <option value="developer">{isArabic ? 'شركة تطوير' : 'Developer'}</option>
                            <option value="investor">{isArabic ? 'مستثمر' : 'Investor'}</option>
                          </select>
                        </div>
                      </td>

                      {/* CLIENT STATUS (Active, Inactive, Prospect) WITH SEMANTIC ICON */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {renderClientStatusBadge(owner, false)}
                          
                          {/* Quick Status Selector */}
                          <select
                            value={clientStatus}
                            onChange={(e) => handleQuickStatusChange(owner.id, e.target.value as OwnerClientStatus)}
                            className="text-[10px] bg-surface border border-border text-text-muted rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-accent opacity-60 hover:opacity-100 cursor-pointer"
                            title={isArabic ? 'تحديث حالة العميل (Active, Inactive, Prospect)' : 'Update client status'}
                          >
                            <option value="Active">{isArabic ? 'نشط (Active)' : 'Active'}</option>
                            <option value="Prospect">{isArabic ? 'محتمل (Prospect)' : 'Prospect'}</option>
                            <option value="Inactive">{isArabic ? 'غير نشط (Inactive)' : 'Inactive'}</option>
                          </select>
                        </div>
                      </td>

                      {/* Phone & Contacts with QUICK CALL (اتصال سريع) Button */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-text text-xs font-semibold">{owner.phone || '-'}</span>
                          </div>

                          {/* Quick Call & WhatsApp Action Buttons */}
                          {owner.phone ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Direct Phone Dial Button */}
                              <a
                                href={`tel:${owner.phone}`}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm hover:scale-105 cursor-pointer"
                                title={isArabic ? `اتصال سريع بالهاتف: ${owner.phone}` : `Quick Call: ${owner.phone}`}
                              >
                                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{isArabic ? 'اتصال سريع' : 'Quick Call'}</span>
                              </a>

                              {/* Direct WhatsApp Button */}
                              {(owner.whatsapp || owner.phone) && (
                                <a
                                  href={`https://wa.me/${(owner.whatsapp || owner.phone || '').replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition hover:scale-105 cursor-pointer"
                                  title={isArabic ? 'فتح واتساب' : 'WhatsApp'}
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-text-muted">{isArabic ? 'لا يوجد رقم' : 'No phone'}</span>
                          )}

                          {owner.email && (
                            <div className="text-[10px] text-text-muted font-sans truncate max-w-[160px]">{owner.email}</div>
                          )}
                        </div>
                      </td>

                      {/* Listed Units */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-accent">
                            {owner.unitsCount ? `${owner.unitsCount}` : '1'}
                          </span>
                          <span className="text-[11px] text-text-muted">{isArabic ? 'وحدات' : 'Units'}</span>
                        </div>
                      </td>

                      {/* Area / Address */}
                      <td className="py-3.5 px-4">
                        <div className="text-text-muted text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-text-muted shrink-0" />
                          <span>{owner.area || owner.address || (isArabic ? '6 أكتوبر' : '6 October')}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Call Phone Action in Actions */}
                          {owner.phone && (
                            <a
                              href={`tel:${owner.phone}`}
                              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                              title={isArabic ? `اتصال سريع: ${owner.phone}` : `Quick Call: ${owner.phone}`}
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                            </a>
                          )}

                          {/* View Drawer Button */}
                          <button
                            onClick={() => setSelectedOwnerForDrawer(owner)}
                            className="p-1.5 rounded-lg bg-accent hover:bg-accent text-accent border border-accent transition cursor-pointer"
                            title={isArabic ? 'فتح النافذة الجانبية لتاريخ الصفقات والوحدات' : 'Open deals & units drawer'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Owner Button */}
                          <button
                            onClick={() => {
                              setEditingOwner(owner);
                              setFormData({
                                name: owner.name,
                                phone: owner.phone,
                                whatsapp: owner.whatsapp || owner.phone,
                                email: owner.email,
                                area: owner.area || owner.address,
                                company: owner.company,
                                unitsCount: Number(owner.unitsCount) || 1,
                                clientCategory: getOwnerNormalizedCategory(owner),
                                clientStatus: getOwnerClientStatus(owner),
                                status: getOwnerClientStatus(owner),
                                notes: owner.notes,
                                avatar: getOwnerAvatarUrl(owner)
                              });
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer"
                            title={isArabic ? 'تعديل بيانات المالك والحالة والصورة' : 'Edit owner & photo'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3.5 bg-surface border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <div>
            {isArabic ? (
              <span>
                عرض <strong className="text-white">{filteredOwners.length}</strong> من أصل{' '}
                <strong className="text-white">{owners.length}</strong> مالك ومسؤول &bull; (اضغط على أي صف لفتح النافذة الجانبية)
              </span>
            ) : (
              <span>
                Showing <strong className="text-white">{filteredOwners.length}</strong> of{' '}
                <strong className="text-white">{owners.length}</strong> owners &bull; (Click any row to open side drawer)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{isArabic ? 'نشط' : 'Active'}: {metrics.active}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>{isArabic ? 'محتمل' : 'Prospect'}: {metrics.prospect}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-surface-raised" />
              <span>{isArabic ? 'غير نشط' : 'Inactive'}: {metrics.inactive}</span>
            </span>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* MOBILE-RESPONSIVE SIDE DRAWER (نافذة جانبية لتاريخ الصفقات والوحدات المرتبطة) */}
      {selectedOwnerForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setSelectedOwnerForDrawer(null)}
            className="fixed inset-0 bg-surface backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            {/* Drawer Container: Full width on mobile screens, max-w-xl on tablets, max-w-2xl on desktop */}
            <div className="w-screen max-w-full sm:max-w-xl md:max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header (Sticky Top with mobile safe margins) */}
              <div className="sticky top-0 bg-surface backdrop-blur z-20 p-4 sm:p-5 border-b border-border flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative group shrink-0">
                    {getOwnerAvatarUrl(selectedOwnerForDrawer) ? (
                      <img
                        src={getOwnerAvatarUrl(selectedOwnerForDrawer)}
                        alt={selectedOwnerForDrawer.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-accent shadow-md ring-1 ring-border"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 shadow-md ${
                        getOwnerClientStatus(selectedOwnerForDrawer) === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : getOwnerClientStatus(selectedOwnerForDrawer) === 'Prospect'
                          ? 'bg-accent text-accent border border-accent'
                          : 'bg-surface-raised text-text-muted border border-border'
                      }`}>
                        {selectedOwnerForDrawer.name ? selectedOwnerForDrawer.name.charAt(0).toUpperCase() : 'O'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const ownerToEdit = selectedOwnerForDrawer;
                        setEditingOwner(ownerToEdit);
                        setFormData({
                          name: ownerToEdit.name,
                          phone: ownerToEdit.phone,
                          whatsapp: ownerToEdit.whatsapp || ownerToEdit.phone,
                          email: ownerToEdit.email,
                          area: ownerToEdit.area || ownerToEdit.address,
                          company: ownerToEdit.company,
                          unitsCount: Number(ownerToEdit.unitsCount) || 1,
                          clientCategory: getOwnerNormalizedCategory(ownerToEdit),
                          clientStatus: getOwnerClientStatus(ownerToEdit),
                          status: getOwnerClientStatus(ownerToEdit),
                          notes: ownerToEdit.notes,
                          avatar: getOwnerAvatarUrl(ownerToEdit)
                        });
                        setIsAddModalOpen(true);
                      }}
                      className="absolute -bottom-1 -right-1 p-1 rounded-full bg-accent hover:bg-accent text-text shadow-md border border-border transition"
                      title={isArabic ? 'تغيير الصورة الشخصية' : 'Change Profile Picture'}
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">
                        {selectedOwnerForDrawer.name}
                      </h3>
                      {renderClientStatusBadge(selectedOwnerForDrawer, true)}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5 flex-wrap">
                      <span className="font-mono text-text-muted bg-surface-raised px-1.5 py-0.2 rounded text-[11px]">
                        {selectedOwnerForDrawer.id}
                      </span>
                      <span>&bull;</span>
                      <span>{getCategoryLabel(getOwnerNormalizedCategory(selectedOwnerForDrawer))}</span>
                      {selectedOwnerForDrawer.company && (
                        <>
                          <span>&bull;</span>
                          <span className="text-accent truncate max-w-[140px]">{selectedOwnerForDrawer.company}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Close Button with generous touch target */}
                <button
                  type="button"
                  onClick={() => setSelectedOwnerForDrawer(null)}
                  className="p-2 sm:p-2.5 rounded-xl bg-surface-raised hover:bg-surface-raised text-text-muted hover:text-white transition cursor-pointer shrink-0 border border-border shadow-sm"
                  title={isArabic ? 'إغلاق النافذة (Esc)' : 'Close Drawer (Esc)'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content Area (Scrollable with mobile-safe padding) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
                
                {/* Owner Portfolio KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-surface border border-border">
                    <span className="text-[11px] text-text-muted block">{isArabic ? 'الوحدات المسجلة' : 'Total Units'}</span>
                    <div className="text-lg font-bold text-accent font-mono mt-0.5">
                      {drawerOwnerUnits.length || selectedOwnerForDrawer.unitsCount || 1}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-border">
                    <span className="text-[11px] text-text-muted block">{isArabic ? 'إجمالي المحفظة' : 'Portfolio Value'}</span>
                    <div className="text-sm sm:text-base font-bold text-white font-mono mt-0.5 truncate">
                      {drawerMetrics.totalVal > 0 ? `${(drawerMetrics.totalVal / 1000000).toFixed(1)}M` : '—'} <span className="text-[10px] text-accent font-sans">ج.م</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-border">
                    <span className="text-[11px] text-text-muted block">{isArabic ? 'صفقات منجزة' : 'Closed Deals'}</span>
                    <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                      {drawerOwnerDeals.length}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-border">
                    <span className="text-[11px] text-text-muted block">{isArabic ? 'حالة الحساب' : 'Client Status'}</span>
                    <div className="mt-1">
                      {renderClientStatusBadge(selectedOwnerForDrawer, true)}
                    </div>
                  </div>
                </div>

                {/* Quick Contact Bar on Mobile/Desktop */}
                <div className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono text-xs text-text">{selectedOwnerForDrawer.phone || '-'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedOwnerForDrawer.phone && (
                      <a
                        href={`tel:${selectedOwnerForDrawer.phone}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'اتصال' : 'Call'}</span>
                      </a>
                    )}
                    {(selectedOwnerForDrawer.whatsapp || selectedOwnerForDrawer.phone) && (
                      <a
                        href={`https://wa.me/${(selectedOwnerForDrawer.whatsapp || selectedOwnerForDrawer.phone || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'واتساب' : 'WhatsApp'}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Navigation Segment Tabs inside Drawer */}
                <div className="flex items-center border-b border-border text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setDrawerActiveTab('units')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                      drawerActiveTab === 'units'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-text-muted hover:text-text'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>{isArabic ? 'الوحدات المرتبطة بالمخزون' : 'Associated Units'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-surface-raised text-text-muted">
                      {drawerOwnerUnits.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawerActiveTab('deals')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                      drawerActiveTab === 'deals'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-text-muted hover:text-text'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>{isArabic ? 'تاريخ الصفقات والعقود' : 'Deals & Contracts'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-surface-raised text-text-muted">
                      {drawerOwnerDeals.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawerActiveTab('performance')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                      drawerActiveTab === 'performance'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-text-muted hover:text-text'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>{isArabic ? 'تحليل الأداء والعوائد' : 'Performance & Yields'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                      ROI
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawerActiveTab('profile')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                      drawerActiveTab === 'profile'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-text-muted hover:text-text'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{isArabic ? 'بيانات المالك' : 'Profile & Notes'}</span>
                  </button>
                </div>

                {/* TAB 1: ASSOCIATED UNITS (الوحدات المرتبطة بهذا المالك) */}
                {drawerActiveTab === 'units' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-muted">
                        {isArabic ? `عقارات ووحدات تابعة لـ ${selectedOwnerForDrawer.name}:` : `Properties owned by ${selectedOwnerForDrawer.name}:`}
                      </span>
                      {onFilterUnitsByOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOwnerForDrawer(null);
                            onFilterUnitsByOwner(selectedOwnerForDrawer.name);
                          }}
                          className="text-[11px] text-accent hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isArabic ? 'عرض في جدول المخزون الكامل' : 'Open in Inventory'}</span>
                          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </button>
                      )}
                    </div>

                    {drawerOwnerUnits.length === 0 ? (
                      <div className="p-8 text-center bg-surface rounded-xl border border-border">
                        <Layers className="w-8 h-8 text-text-muted mx-auto mb-2" />
                        <p className="text-xs text-text-muted font-semibold">
                          {isArabic ? 'لا توجد وحدات مسجلة حالياً لهذا المالك' : 'No units linked to this owner yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {drawerOwnerUnits.map((u, i) => (
                          <div
                            key={u.id || i}
                            className="p-3.5 rounded-xl bg-surface border border-border hover:border-border transition space-y-2 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-accent bg-accent px-2 py-0.5 rounded border border-accent">
                                    {u.id}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getUnitStatusBadgeClass(u.status)}`}>
                                    {u.status}
                                  </span>
                                  <span className="text-[11px] text-text-muted font-semibold">
                                    {u.unitType || u.propertyType}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-1">{u.compound}</h4>
                                <div className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-text-muted" />
                                  <span>{u.area}</span>
                                </div>
                              </div>

                              <div className="text-end shrink-0">
                                <span className="text-[10px] text-text-muted block uppercase font-semibold">
                                  {isArabic ? 'السعر المطلوب' : 'Price'}
                                </span>
                                <div className="font-bold text-white text-sm font-mono">
                                  {formatNumber(u.price)} <span className="text-[10px] text-accent font-sans">{u.currency}</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-muted flex-wrap gap-2">
                              <div className="flex items-center gap-3">
                                {u.beds && (
                                  <span className="flex items-center gap-1">
                                    <Bed className="w-3.5 h-3.5 text-text-muted" />
                                    <span>{u.beds} {isArabic ? 'غرف' : 'Beds'}</span>
                                  </span>
                                )}
                                {u.size && (
                                  <span className="flex items-center gap-1">
                                    <Maximize2 className="w-3.5 h-3.5 text-text-muted" />
                                    <span>{u.size} م²</span>
                                  </span>
                                )}
                              </div>

                              <span className="text-[11px] text-text-muted">
                                {u.deliveryDate ? `${isArabic ? 'الاستلام:' : 'Delivery:'} ${u.deliveryDate}` : (isArabic ? 'جاهز للمعاينة' : 'Ready')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: DEALS & CONTRACTS HISTORY (تاريخ الصفقات والعقود) */}
                {drawerActiveTab === 'deals' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-muted">
                        {isArabic ? 'سجل العمليات والصفقات المبرمة مع المالك:' : 'Deals & Contracts Log:'}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {isArabic ? 'إجمالي المحقق: ' : 'Total: '}
                        {formatNumber(drawerMetrics.completedDealsVal)} ج.م
                      </span>
                    </div>

                    {drawerOwnerDeals.length === 0 ? (
                      <div className="p-8 text-center bg-surface rounded-xl border border-border">
                        <DollarSign className="w-8 h-8 text-text-muted mx-auto mb-2" />
                        <p className="text-xs text-text-muted font-semibold">
                          {isArabic ? 'لا توجد صفقات أو عقود مبرمة مسجلة لهذا المالك' : 'No recorded transactions yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {drawerOwnerDeals.map((deal, i) => (
                          <div
                            key={deal.id || i}
                            className="p-4 rounded-xl bg-surface border border-border space-y-2.5 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-accent bg-accent px-2 py-0.5 rounded border border-accent">
                                    {deal.contractNumber || deal.id}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                    deal.status === 'paid'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : deal.status === 'approved'
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                      : 'bg-accent text-accent border border-accent'
                                  }`}>
                                    {deal.status === 'paid' ? (isArabic ? 'مسددة بالكامل' : 'Paid') : deal.status === 'approved' ? (isArabic ? 'معتمدة' : 'Approved') : (isArabic ? 'قيد التنفيذ' : 'Pending')}
                                  </span>
                                  <span className="text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                                    {deal.contractType === 'sale' ? (isArabic ? 'بيع نهائي' : 'Sale') : deal.contractType === 'rent' ? (isArabic ? 'إيجار' : 'Lease') : (isArabic ? 'تسويق حصري' : 'Exclusive')}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-1.5">{deal.compound} &bull; وحدة {deal.unitId}</h4>
                              </div>

                              <div className="text-end shrink-0">
                                <span className="text-[10px] text-text-muted block uppercase font-semibold">
                                  {isArabic ? 'قيمة الصفقة' : 'Deal Value'}
                                </span>
                                <div className="font-bold text-emerald-400 text-sm font-mono">
                                  {formatNumber(deal.dealValue)} <span className="text-[10px] text-text-muted font-sans">ج.م</span>
                                </div>
                              </div>
                            </div>

                            {/* Details grid inside deal card */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs text-text-muted">
                              <div>
                                <span className="text-[10px] text-text-muted block">{isArabic ? 'المشتري / الطرف الثاني:' : 'Client / Buyer:'}</span>
                                <span className="font-semibold text-white">{deal.clientName || 'عميل مسجل'}</span>
                              </div>

                              <div>
                                <span className="text-[10px] text-text-muted block">{isArabic ? 'تاريخ الإغلاق:' : 'Closing Date:'}</span>
                                <span className="font-mono text-text-muted">{deal.closingDate}</span>
                              </div>

                              <div>
                                <span className="text-[10px] text-text-muted block">{isArabic ? 'عمولة الوساطة:' : 'Commission:'}</span>
                                <span className="font-mono text-accent font-semibold">
                                  {deal.commissionRate}% ({formatNumber(deal.totalCommission)} ج.م)
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] text-text-muted block">{isArabic ? 'مسؤول المتابعة:' : 'Agent:'}</span>
                                <span className="text-text-muted">{deal.agentName}</span>
                              </div>
                            </div>

                            {deal.notes && (
                              <p className="text-[11px] text-text-muted bg-surface p-2 rounded-lg border border-border mt-1">
                                {deal.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: OWNER PROFILE & NOTES (بيانات المالك والتواصل) */}
                {drawerActiveTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          <span>{isArabic ? 'بيانات الاتصال والتسجيل' : 'Contact & Registration Info'}</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            const ownerToEdit = selectedOwnerForDrawer;
                            setEditingOwner(ownerToEdit);
                            setFormData({
                              name: ownerToEdit.name,
                              phone: ownerToEdit.phone,
                              whatsapp: ownerToEdit.whatsapp || ownerToEdit.phone,
                              email: ownerToEdit.email,
                              area: ownerToEdit.area || ownerToEdit.address,
                              company: ownerToEdit.company,
                              unitsCount: Number(ownerToEdit.unitsCount) || 1,
                              clientCategory: getOwnerNormalizedCategory(ownerToEdit),
                              clientStatus: getOwnerClientStatus(ownerToEdit),
                              status: getOwnerClientStatus(ownerToEdit),
                              notes: ownerToEdit.notes,
                              avatar: getOwnerAvatarUrl(ownerToEdit)
                            });
                            setIsAddModalOpen(true);
                          }}
                          className="text-[11px] text-accent hover:text-accent font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'تغيير الصورة الشخصية' : 'Change Photo'}</span>
                        </button>
                      </div>

                      {/* Profile Card Header with Avatar & Quick Call */}
                      <div className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {getOwnerAvatarUrl(selectedOwnerForDrawer) ? (
                            <img
                              src={getOwnerAvatarUrl(selectedOwnerForDrawer)}
                              alt={selectedOwnerForDrawer.name}
                              className="w-12 h-12 rounded-xl object-cover border-2 border-accent shadow-sm ring-1 ring-border"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center font-bold text-sm text-text-muted">
                              {selectedOwnerForDrawer.name ? selectedOwnerForDrawer.name.charAt(0).toUpperCase() : 'O'}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white text-sm block">{selectedOwnerForDrawer.name}</span>
                            <span className="text-[11px] text-text-muted">{getCategoryLabel(getOwnerNormalizedCategory(selectedOwnerForDrawer))}</span>
                          </div>
                        </div>

                        {selectedOwnerForDrawer.phone && (
                          <a
                            href={`tel:${selectedOwnerForDrawer.phone}`}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'اتصال سريع' : 'Quick Call'}</span>
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-text-muted block text-[10px]">{isArabic ? 'الاسم الكامل:' : 'Full Name:'}</span>
                          <span className="font-bold text-white text-sm">{selectedOwnerForDrawer.name}</span>
                        </div>

                        <div>
                          <span className="text-text-muted block text-[10px]">{isArabic ? 'كود المالك:' : 'Owner ID:'}</span>
                          <span className="font-mono text-accent">{selectedOwnerForDrawer.id}</span>
                        </div>

                        <div>
                          <span className="text-text-muted block text-[10px]">{isArabic ? 'تصنيف العميل:' : 'Category:'}</span>
                          <span className="mt-1 inline-block">{renderCategoryBadge(selectedOwnerForDrawer)}</span>
                        </div>

                        <div>
                          <span className="text-text-muted block text-[10px]">{isArabic ? 'حالة العميل:' : 'Status:'}</span>
                          <span className="mt-1 inline-block">{renderClientStatusBadge(selectedOwnerForDrawer, false)}</span>
                        </div>

                        <div>
                          <span className="text-text-muted block text-[10px]">{isArabic ? 'الهاتف الرئيسي:' : 'Phone:'}</span>
                          <span className="font-mono text-text">{selectedOwnerForDrawer.phone || '-'}</span>
                        </div>

                        <div>
                          <span className="text-text-muted block text-[10px]">{isArabic ? 'الواتساب:' : 'WhatsApp:'}</span>
                          <span className="font-mono text-emerald-400">{selectedOwnerForDrawer.whatsapp || selectedOwnerForDrawer.phone || '-'}</span>
                        </div>

                        <div>
                          <span className="text-text-muted block text-[10px]">{isArabic ? 'البريد الإلكتروني:' : 'Email:'}</span>
                          <span className="text-text-muted">{selectedOwnerForDrawer.email || '-'}</span>
                        </div>

                        <div>
                          <span className="text-text-muted block text-[10px]">{isArabic ? 'الشركة / الكيان:' : 'Company:'}</span>
                          <span className="text-text-muted">{selectedOwnerForDrawer.company || (isArabic ? 'فردي' : 'Individual')}</span>
                        </div>
                      </div>

                      {selectedOwnerForDrawer.address && (
                        <div className="pt-2 border-t border-border text-xs">
                          <span className="text-text-muted block text-[10px]">{isArabic ? 'العنوان والموقع:' : 'Address:'}</span>
                          <span className="text-text flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-text-muted" />
                            {selectedOwnerForDrawer.address}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Internal Notes */}
                    <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                      <h4 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        <span>{isArabic ? 'ملاحظات المحفظة والوسيط' : 'Internal Portfolio Notes'}</span>
                      </h4>
                      <p className="text-xs text-text-muted leading-relaxed bg-surface p-3 rounded-lg border border-border">
                        {selectedOwnerForDrawer.notes || (isArabic ? 'لا توجد ملاحظات إضافية مسجلة.' : 'No additional notes logged.')}
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 4: PERFORMANCE & PORTFOLIO RETURNS ANALYTICS */}
                {drawerActiveTab === 'performance' && (
                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-accent via-emerald-500/10 to-transparent border border-accent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-accent" />
                          <h4 className="text-sm font-bold text-white">
                            {isArabic ? `تقرير أداء محفظة: ${selectedOwnerForDrawer.name}` : `Portfolio Performance: ${selectedOwnerForDrawer.name}`}
                          </h4>
                        </div>
                        <p className="text-[11px] text-text-muted mt-1">
                          {isArabic ? 'تحليل العوائد الإجمالية الناتجة عن الصفقات وتتبع نمو الأصول العقارية' : 'Total returns from closed transactions & asset portfolio growth'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPreselectedOwnerForReports(selectedOwnerForDrawer.id);
                          setActiveOwnersSubView('performance');
                          setSelectedOwnerForDrawer(null);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-accent hover:bg-accent text-text text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>{isArabic ? 'فتح التقرير الشامل' : 'Open Full Analytics'}</span>
                      </button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3.5 rounded-xl bg-surface border border-border">
                        <span className="text-[11px] text-text-muted block">{isArabic ? 'العوائد الإجمالية المحققة' : 'Realized Deal Returns'}</span>
                        <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono mt-1">
                          {(drawerMetrics.completedDealsVal / 1000000).toFixed(2)} <span className="text-xs font-sans">مليون ج.م</span>
                        </div>
                        <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                          {drawerOwnerDeals.filter(d => d.status === 'paid' || d.status === 'approved').length} {isArabic ? 'صفقات منجزة' : 'Closed Deals'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface border border-border">
                        <span className="text-[11px] text-text-muted block">{isArabic ? 'قيمة الأصول الإجمالية' : 'Total Portfolio Value'}</span>
                        <div className="text-base sm:text-lg font-bold text-white font-mono mt-1">
                          {(drawerMetrics.totalVal / 1000000).toFixed(2)} <span className="text-xs text-accent font-sans">مليون ج.م</span>
                        </div>
                        <span className="text-[10px] text-text-muted block mt-0.5">
                          {drawerOwnerUnits.length} {isArabic ? 'وحدات مسجلة' : 'Registered Units'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface border border-border">
                        <span className="text-[11px] text-text-muted block">{isArabic ? 'معدل تحقيق السيولة' : 'Yield Realization'}</span>
                        <div className="text-base sm:text-lg font-bold text-sky-400 font-mono mt-1">
                          {drawerMetrics.totalVal > 0 ? Math.min(100, Math.round((drawerMetrics.completedDealsVal / drawerMetrics.totalVal) * 100)) : 0}%
                        </div>
                        <span className="text-[10px] text-text-muted block mt-0.5">
                          {isArabic ? 'نسبة الصفقات للأصول' : 'Returns vs Portfolio'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface border border-border">
                        <span className="text-[11px] text-text-muted block">{isArabic ? 'معدل النمو السنوي المقدر' : 'Est. YoY Growth'}</span>
                        <div className="text-base sm:text-lg font-bold text-accent font-mono mt-1 flex items-center gap-1">
                          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                          <span>+{Math.round(14 + ((drawerOwnerUnits.length * 2.5) % 15))}%</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 block mt-0.5">
                          {isArabic ? 'توسع وتراكم المحفظة' : 'Portfolio Expansion'}
                        </span>
                      </div>
                    </div>

                    {/* Yield Progression Bar */}
                    <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-text-muted">{isArabic ? 'توزيع المحفظة (السيولة المحققة مقابل الأصول الحالية)' : 'Liquidity Realization vs Current Assets'}</span>
                        <span className="text-accent font-mono">
                          {drawerMetrics.totalVal > 0 ? Math.min(100, Math.round((drawerMetrics.completedDealsVal / drawerMetrics.totalVal) * 100)) : 0}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-surface-raised rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{
                            width: `${drawerMetrics.totalVal > 0 ? Math.min(100, Math.round((drawerMetrics.completedDealsVal / drawerMetrics.totalVal) * 100)) : 15}%`
                          }}
                          title={isArabic ? 'عوائد الصفقات المغلقة' : 'Realized Deals'}
                        />
                        <div
                          className="bg-accent h-full transition-all duration-500"
                          style={{
                            width: `${100 - (drawerMetrics.totalVal > 0 ? Math.min(100, Math.round((drawerMetrics.completedDealsVal / drawerMetrics.totalVal) * 100)) : 15)}%`
                          }}
                          title={isArabic ? 'أصول متاحة للبيع' : 'Active Units'}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-text-muted pt-1">
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{isArabic ? 'عوائد الصفقات:' : 'Deals Yield:'} {(drawerMetrics.completedDealsVal / 1000000).toFixed(1)}M ج.م</span>
                        </span>
                        <span className="flex items-center gap-1 text-accent font-medium">
                          <span className="w-2 h-2 rounded-full bg-accent" />
                          <span>{isArabic ? 'أصول نشطة:' : 'Active Value:'} {(drawerMetrics.totalVal / 1000000).toFixed(1)}M ج.م</span>
                        </span>
                      </div>
                    </div>

                    {/* Deals Yield Breakdown */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-text-muted flex items-center justify-between">
                        <span>{isArabic ? 'تفاصيل عوائد الصفقات والعقود المنجزة:' : 'Deals Returns Breakdown:'}</span>
                        <span className="text-[11px] font-mono text-emerald-400">{drawerOwnerDeals.length} {isArabic ? 'سجلات' : 'records'}</span>
                      </h5>
                      {drawerOwnerDeals.length === 0 ? (
                        <div className="p-4 text-center bg-surface rounded-xl border border-border text-xs text-text-muted">
                          {isArabic ? 'لا توجد صفقات منفذة مسجلة حالياً' : 'No closed deals logged for this owner yet'}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {drawerOwnerDeals.map((deal, idx) => (
                            <div key={deal.id || idx} className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between gap-2 text-xs">
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{deal.contractNumber}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${deal.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-accent text-accent'}`}>
                                    {deal.status === 'paid' ? (isArabic ? 'مدفوع' : 'Paid') : (isArabic ? 'معتمد' : 'Approved')}
                                  </span>
                                </div>
                                <span className="text-[11px] text-text-muted">{deal.compound} &bull; {deal.clientName}</span>
                              </div>
                              <div className="text-end">
                                <div className="font-mono font-bold text-emerald-400">
                                  {formatNumber(deal.dealValue)} ج.م
                                </div>
                                <span className="text-[10px] text-text-muted">{deal.closingDate}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer (Sticky Bottom with mobile action buttons) */}
              <div className="sticky bottom-0 bg-surface backdrop-blur p-4 border-t border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const ownerToEdit = selectedOwnerForDrawer;
                      setSelectedOwnerForDrawer(null);
                      setEditingOwner(ownerToEdit);
                      setFormData({
                        name: ownerToEdit.name,
                        phone: ownerToEdit.phone,
                        whatsapp: ownerToEdit.whatsapp || ownerToEdit.phone,
                        email: ownerToEdit.email,
                        area: ownerToEdit.area || ownerToEdit.address,
                        company: ownerToEdit.company,
                        unitsCount: Number(ownerToEdit.unitsCount) || 1,
                        clientCategory: getOwnerNormalizedCategory(ownerToEdit),
                        clientStatus: getOwnerClientStatus(ownerToEdit),
                        status: getOwnerClientStatus(ownerToEdit),
                        notes: ownerToEdit.notes,
                        avatar: getOwnerAvatarUrl(ownerToEdit)
                      });
                      setIsAddModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-surface-raised hover:bg-surface-raised text-text border border-border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-accent" />
                    <span>{isArabic ? 'تعديل البيانات' : 'Edit Owner'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOwnerForDrawer(null)}
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent text-text text-xs font-bold transition cursor-pointer shadow-md"
                >
                  {isArabic ? 'إغلاق النافذة' : 'Close'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Owner Modal with Client Status Selection */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl p-5 space-y-4 scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent" />
                <span>
                  {editingOwner 
                    ? (isArabic ? 'تعديل بيانات وتصنيف وحالة المالك' : 'Edit Owner Details')
                    : (isArabic ? 'إضافة مالك أو مطور جديد' : 'Add New Owner')}
                </span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-surface-raised"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOwner} className="space-y-4">
              {/* OWNER PROFILE PICTURE (رفع صورة / التقاط بالكاميرا) */}
              <div className="p-3.5 bg-surface rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-accent" />
                    <span>{isArabic ? 'صورة المالك الشخصية (Profile Picture):' : 'Owner Profile Picture:'}</span>
                  </label>
                  {formData.avatar && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{isArabic ? 'إزالة الصورة' : 'Remove Photo'}</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="relative shrink-0">
                    {formData.avatar ? (
                      <div className="relative">
                        <img
                          src={formData.avatar}
                          alt="Owner Preview"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-accent shadow-md ring-2 ring-border"
                        />
                        <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                          ✓
                        </span>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-surface border-2 border-dashed border-border flex items-center justify-center text-text-muted">
                        <User className="w-7 h-7 text-text-muted" />
                      </div>
                    )}
                  </div>

                  {/* Actions & Buttons */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-1.5 bg-surface p-1 rounded-lg border border-border text-[11px] font-semibold">
                      {/* Upload from Device button */}
                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          fileInputRef.current?.click();
                        }}
                        className="flex-1 py-1.5 px-2 rounded-md bg-surface-raised hover:bg-surface-raised text-text transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-accent" />
                        <span>{isArabic ? 'اختيار صورة' : 'Upload'}</span>
                      </button>

                      {/* Live Camera Snapshot Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isCameraActive) {
                            stopCamera();
                          } else {
                            startCamera();
                          }
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-md transition flex items-center justify-center gap-1 cursor-pointer ${
                          isCameraActive ? 'bg-accent text-text font-bold shadow-sm' : 'bg-surface-raised hover:bg-surface-raised text-text'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isCameraActive ? (isArabic ? 'إيقاف' : 'Stop') : (isArabic ? 'الكاميرا' : 'Camera')}</span>
                      </button>

                      {/* Direct Mobile Selfie Camera Input Button */}
                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          cameraInputRef.current?.click();
                        }}
                        className="py-1.5 px-2 rounded-md bg-surface-raised hover:bg-surface-raised text-text transition sm:hidden cursor-pointer"
                        title={isArabic ? 'كاميرا الهاتف المباشرة' : 'Mobile Camera'}
                      >
                        📱
                      </button>

                      {/* URL Mode Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          setAvatarTabMode(avatarTabMode === 'url' ? 'presets' : 'url');
                        }}
                        className={`py-1.5 px-2 rounded-md transition cursor-pointer ${
                          avatarTabMode === 'url' ? 'bg-accent text-accent border border-accent' : 'bg-surface-raised text-text-muted'
                        }`}
                        title={isArabic ? 'إدخال رابط صورة' : 'Paste Image URL'}
                      >
                        <Image className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Hidden Native File Inputs */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      accept="image/*"
                      capture="user"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    {/* Image URL Input Form */}
                    {avatarTabMode === 'url' && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="url"
                          placeholder={isArabic ? 'رابط الصورة المباشر (https://...)' : 'Image URL (https://...)'}
                          value={avatarUrlInput}
                          onChange={(e) => setAvatarUrlInput(e.target.value)}
                          className="flex-1 bg-surface border border-border rounded-md px-2.5 py-1 text-xs text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (avatarUrlInput.trim()) {
                              setFormData(prev => ({ ...prev, avatar: avatarUrlInput.trim() }));
                              setAvatarUrlInput('');
                            }
                          }}
                          className="px-2.5 py-1 bg-accent text-text text-xs font-bold rounded-md hover:bg-accent cursor-pointer"
                        >
                          {isArabic ? 'حفظ' : 'Set'}
                        </button>
                      </div>
                    )}

                    {/* Preset Avatars Row */}
                    <div className="pt-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                      <span className="text-[10px] text-text-muted shrink-0">{isArabic ? 'نماذج جاهزة:' : 'Presets:'}</span>
                      {PRESET_AVATARS.map((p, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            stopCamera();
                            setFormData(prev => ({ ...prev, avatar: p.url }));
                          }}
                          className={`w-6 h-6 rounded-full overflow-hidden border transition shrink-0 hover:scale-110 cursor-pointer ${
                            formData.avatar === p.url ? 'border-accent ring-2 ring-accent' : 'border-border opacity-60 hover:opacity-100'
                          }`}
                          title={p.label}
                        >
                          <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LIVE CAMERA VIEWFINDER & SNAPSHOT TRIGGER */}
                {isCameraActive && (
                  <div className="p-3 bg-surface rounded-xl border border-accent space-y-2 animate-in fade-in duration-200">
                    <div className="relative aspect-video max-h-48 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-red-600/80 text-white text-[10px] font-bold flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        <span>LIVE CAMERA</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-text font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isArabic ? '📸 التقاط الصورة الشخصية الآن' : '📸 Snap Photo Now'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="py-2 px-3 bg-surface-raised hover:bg-surface-raised text-text-muted text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        {isArabic ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-[11px] text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  {isArabic ? 'اسم المالك أو الشركة:' : 'Owner or Company Name:'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={isArabic ? 'مثال: عمر علي محمد أو شركة بالم هيلز' : 'e.g. John Doe or Real Estate Corp'}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* CLASSIFICATION & CLIENT STATUS SELECTORS IN MODAL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    {isArabic ? 'تصنيف العميل:' : 'Client Category:'} *
                  </label>
                  <select
                    value={formData.clientCategory || 'individual'}
                    onChange={(e) => setFormData({ ...formData, clientCategory: e.target.value as 'individual' | 'developer' | 'investor' })}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="individual">{isArabic ? 'مالك فردي (Individual)' : 'Individual Owner'}</option>
                    <option value="developer">{isArabic ? 'شركة تطوير (Developer)' : 'Developer Company'}</option>
                    <option value="investor">{isArabic ? 'مستثمر (Investor)' : 'Investor'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    {isArabic ? 'حالة العميل (Client Status):' : 'Client Status:'} *
                  </label>
                  <select
                    value={formData.clientStatus || 'Active'}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      clientStatus: e.target.value as OwnerClientStatus,
                      status: e.target.value as OwnerClientStatus
                    })}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-bold"
                  >
                    <option value="Active">{isArabic ? '🟢 نشط (Active)' : '🟢 Active'}</option>
                    <option value="Prospect">{isArabic ? '🟡 محتمل (Prospect)' : '🟡 Prospect'}</option>
                    <option value="Inactive">{isArabic ? '⚪ غير نشط (Inactive)' : '⚪ Inactive'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    {isArabic ? 'رقم الهاتف:' : 'Phone Number:'}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010xxxxxxxx"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    {isArabic ? 'رقم الواتساب:' : 'WhatsApp:'}
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="2010xxxxxxxx"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    {isArabic ? 'البريد الإلكتروني:' : 'Email:'}
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="owner@domain.com"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    {isArabic ? 'عدد الوحدات المسجلة:' : 'Units Count:'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.unitsCount || 1}
                    onChange={(e) => setFormData({ ...formData, unitsCount: Number(e.target.value) || 1 })}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  {isArabic ? 'المنطقة أو المشروع / العنوان:' : 'Area or Address:'}
                </label>
                <input
                  type="text"
                  value={formData.area || ''}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder={isArabic ? 'مثال: 6 أكتوبر - الحي الأول، كمبوند الأشجار' : 'e.g. 6 October - First District'}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  {isArabic ? 'ملاحظات إضافية:' : 'Additional Notes:'}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={isArabic ? 'أي تفاصيل عن خطط البيع أو الوحدات التابعة' : 'Notes about owner portfolio'}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-white bg-surface-raised hover:bg-surface-raised transition"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-text bg-accent hover:bg-accent shadow-md shadow-accent/20 transition"
                >
                  {isArabic ? 'حفظ البيانات' : 'Save Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnersTab;
