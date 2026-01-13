'use client'

// Using lucide-react for better, consistent icons
import { 
  Building2, Search, MapPin, Users, 
  Zap, TrendingUp, CheckCircle2, BarChart3,
  FileText, Layers, Sparkles, Clock
} from 'lucide-react'

export const BuildingIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Building2 className={className} />
)

export const SearchIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Search className={className} />
)

export const MapPinIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <MapPin className={className} />
)

export const UsersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Users className={className} />
)

export const ZapIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Zap className={className} />
)

export const TrendingUpIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <TrendingUp className={className} />
)

export const CheckCircleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <CheckCircle2 className={className} />
)

export const BarChartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <BarChart3 className={className} />
)

export const FileTextIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <FileText className={className} />
)

export const LayersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Layers className={className} />
)

export const SparklesIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Sparkles className={className} />
)

export const ClockIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <Clock className={className} />
)
