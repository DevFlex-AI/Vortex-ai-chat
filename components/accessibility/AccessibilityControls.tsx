'use client'
import { useState, useCallback, memo } from 'react'
import { Accessibility, Type, Contrast, Volume2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils'

interface AccessibilitySettings {
  fontSize: number
  highContrast: boolean
  reducedMotion: boolean
  screenReaderMode: boolean
  voiceSpeed: number
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  focusIndicator: boolean
  keyboardNavigation: boolean
}

interface AccessibilityControlsProps {
  settings: AccessibilitySettings
  onSettingsChange: (settings: Partial<AccessibilitySettings>) => void
  className?: string
}

function AccessibilityControls({ settings, onSettingsChange, className }: AccessibilityControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    onSettingsChange({ [key]: value })
  }, [onSettingsChange])

  const applyAccessibilityStyles = useCallback(() => {
    const root = document.documentElement

    // Font size
    root.style.setProperty('--accessibility-font-scale', `${settings.fontSize / 100}`)

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Color blind mode
    root.setAttribute('data-colorblind-mode', settings.colorBlindMode)

    // Focus indicator
    if (settings.focusIndicator) {
      root.classList.add('enhanced-focus')
    } else {
      root.classList.remove('enhanced-focus')
    }
  }, [settings])

  // Apply styles when settings change
  React.useEffect(() => {
    applyAccessibilityStyles()
  }, [applyAccessibilityStyles])

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Font Size */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Size: {settings.fontSize}%
            </Label>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) => updateSetting('fontSize', value)}
              min={75}
              max={150}
              step={5}
              className="w-full"
            />
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Contrast className="h-4 w-4" />
              High Contrast Mode
            </Label>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={(checked) => updateSetting('highContrast', checked)}
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <Label>Reduce Motion</Label>
            <Switch
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
            />
          </div>

          {/* Screen Reader Mode */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Screen Reader Optimized
            </Label>
            <Switch
              checked={settings.screenReaderMode}
              onCheckedChange={(checked) => updateSetting('screenReaderMode', checked)}
            />
          </div>

          {/* Voice Speed */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Voice Speed: {settings.voiceSpeed}x
            </Label>
            <Slider
              value={[settings.voiceSpeed]}
              onValueChange={([value]) => updateSetting('voiceSpeed', value)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Color Blind Support */}
          <div className="space-y-2">
            <Label>Color Blind Support</Label>
            <Select
              value={settings.colorBlindMode}
              onValueChange={(value: AccessibilitySettings['colorBlindMode']) => 
                updateSetting('colorBlindMode', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="protanopia">Protanopia (Red-blind)</SelectItem>
                <SelectItem value="deuteranopia">Deuteranopia (Green-blind)</SelectItem>
                <SelectItem value="tritanopia">Tritanopia (Blue-blind)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Focus */}
          <div className="flex items-center justify-between">
            <Label>Enhanced Focus Indicators</Label>
            <Switch
              checked={settings.focusIndicator}
              onCheckedChange={(checked) => updateSetting('focusIndicator', checked)}
            />
          </div>

          {/* Keyboard Navigation */}
          <div className="flex items-center justify-between">
            <Label>Keyboard Navigation Hints</Label>
            <Switch
              checked={settings.keyboardNavigation}
              onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              These settings are saved to your profile and will apply across all devices.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default memo(AccessibilityControls)