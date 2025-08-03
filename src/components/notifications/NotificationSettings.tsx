import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { 
  Settings,
  Volume2,
  VolumeX,
  Clock,
  Trash2,
  Bell,
  Mail,
  Smartphone
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotificationSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationSettings({ open, onOpenChange }: NotificationSettingsProps) {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    enableSound: true,
    enablePush: true,
    enableEmail: false,
    enableSMS: false,
    soundVolume: [75],
    autoDeleteDays: "30",
    muteHours: {
      enabled: false,
      start: "22:00",
      end: "08:00"
    },
    categories: {
      products: true,
      labels: true,
      compliance: true,
      reports: false,
      system: true
    }
  })

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateCategorySetting = (category: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }))
  }

  const updateMuteHours = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      muteHours: {
        ...prev.muteHours,
        [key]: value
      }
    }))
  }

  const playTestSound = () => {
    if (settings.enableSound) {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      gainNode.gain.setValueAtTime(settings.soundVolume[0] / 100 * 0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
      
      toast({
        title: "Test notification sound",
        description: "This is how your notifications will sound"
      })
    } else {
      toast({
        title: "Sound is disabled",
        description: "Enable sound notifications to test"
      })
    }
  }

  const saveSettings = () => {
    // Here you would typically save to your backend
    toast({
      title: "Settings saved",
      description: "Your notification preferences have been updated"
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
          <DialogDescription>
            Configure how you receive notifications and manage your preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sound Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Sound Settings
              </CardTitle>
              <CardDescription>
                Configure notification sounds and volume
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable notification sounds</Label>
                  <div className="text-sm text-muted-foreground">
                    Play sound when new notifications arrive
                  </div>
                </div>
                <Switch
                  checked={settings.enableSound}
                  onCheckedChange={(checked) => updateSetting('enableSound', checked)}
                />
              </div>

              {settings.enableSound && (
                <>
                  <div className="space-y-2">
                    <Label>Volume Level</Label>
                    <div className="flex items-center gap-4">
                      <VolumeX className="h-4 w-4" />
                      <Slider
                        value={settings.soundVolume}
                        onValueChange={(value) => updateSetting('soundVolume', value)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <Volume2 className="h-4 w-4" />
                      <span className="text-sm w-12">{settings.soundVolume[0]}%</span>
                    </div>
                  </div>

                  <Button onClick={playTestSound} variant="outline" size="sm">
                    Test Sound
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Delivery Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Delivery Methods
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <Label>Push notifications</Label>
                </div>
                <Switch
                  checked={settings.enablePush}
                  onCheckedChange={(checked) => updateSetting('enablePush', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <Label>Email notifications</Label>
                </div>
                <Switch
                  checked={settings.enableEmail}
                  onCheckedChange={(checked) => updateSetting('enableEmail', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <Label>SMS notifications</Label>
                </div>
                <Switch
                  checked={settings.enableSMS}
                  onCheckedChange={(checked) => updateSetting('enableSMS', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Auto-delete Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Auto-delete Settings
              </CardTitle>
              <CardDescription>
                Automatically delete old notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Delete notifications after</Label>
                <Select 
                  value={settings.autoDeleteDays} 
                  onValueChange={(value) => updateSetting('autoDeleteDays', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quiet Hours
              </CardTitle>
              <CardDescription>
                Mute notifications during specific hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable quiet hours</Label>
                <Switch
                  checked={settings.muteHours.enabled}
                  onCheckedChange={(checked) => updateMuteHours('enabled', checked)}
                />
              </div>

              {settings.muteHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start time</Label>
                    <input
                      type="time"
                      value={settings.muteHours.start}
                      onChange={(e) => updateMuteHours('start', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End time</Label>
                    <input
                      type="time"
                      value={settings.muteHours.end}
                      onChange={(e) => updateMuteHours('end', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Categories</CardTitle>
              <CardDescription>
                Choose which types of notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Product updates</Label>
                <Switch
                  checked={settings.categories.products}
                  onCheckedChange={(checked) => updateCategorySetting('products', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Label generation</Label>
                <Switch
                  checked={settings.categories.labels}
                  onCheckedChange={(checked) => updateCategorySetting('labels', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Compliance alerts</Label>
                <Switch
                  checked={settings.categories.compliance}
                  onCheckedChange={(checked) => updateCategorySetting('compliance', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Reports and analytics</Label>
                <Switch
                  checked={settings.categories.reports}
                  onCheckedChange={(checked) => updateCategorySetting('reports', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>System updates</Label>
                <Switch
                  checked={settings.categories.system}
                  onCheckedChange={(checked) => updateCategorySetting('system', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}