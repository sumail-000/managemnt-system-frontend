import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  User,
  Shield,
  Key,
  Activity,
  Settings,
  Clock,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Edit,
  Save,
  Camera,
  Loader2,
  Plus,
  Minus,
  Globe
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { adminProfileAPI } from "@/services/adminAPI"
import { useToast } from "@/hooks/use-toast"
import { getAvatarUrl } from "@/utils/storage"

interface AdminProfileData {
  id: number
  name: string
  email: string
  avatar?: string
  role: string
  role_display: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

interface Permission {
  module: string
  read: boolean
  write: boolean
  delete: boolean
}

interface Activity {
  id: number
  action: string
  target: string
  timestamp: string
  type: string
}

export default function AdminProfile() {
  const { admin } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<AdminProfileData | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [securitySettings, setSecuritySettings] = useState({
    ip_restriction_enabled: false,
    allowed_ips: [] as string[],
    login_notifications_enabled: false
  })
  const [showIpDialog, setShowIpDialog] = useState(false)
  const [ipInputs, setIpInputs] = useState([''])
  const [currentIp, setCurrentIp] = useState('')
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)

  // Fetch admin profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const response = await adminProfileAPI.getProfile()
        
        setProfile(response.data.profile)
        setFormData({
          name: response.data.profile.name,
          email: response.data.profile.email
        })
        
        // Set security settings
        setSecuritySettings({
          ip_restriction_enabled: response.data.profile.ip_restriction_enabled || false,
          allowed_ips: response.data.profile.allowed_ips || [],
          login_notifications_enabled: response.data.profile.login_notifications_enabled || false
        })
        
        // Format permissions data
        const formattedPermissions: Permission[] = [
          { module: "User Management", read: true, write: true, delete: true },
          { module: "Product Oversight", read: true, write: true, delete: true },
          { module: "Analytics", read: true, write: false, delete: false },
          { module: "System Settings", read: true, write: true, delete: false },
          { module: "Support Center", read: true, write: true, delete: false },
          { module: "Reports", read: true, write: true, delete: false }
        ]
        setPermissions(formattedPermissions)
        
        // Format activity data
        const formattedActivity: Activity[] = response.data.recent_activity.map((activity: any, index: number) => ({
          id: index + 1,
          action: activity.action,
          target: activity.target || "",
          timestamp: activity.timestamp,
          type: activity.type
        }))
        setRecentActivity(formattedActivity)
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        })
        console.error("Failed to fetch profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [toast])

  const handleSave = async () => {
    if (!profile) return
    
    try {
      setIsSaving(true)
      console.log('💾 Starting profile save process...');
      
      // Update profile information
      const updateData = {
        name: formData.name,
        email: formData.email
      }
      
      console.log('📝 Updating profile data:', updateData);
      await adminProfileAPI.updateProfile(updateData)
      
      // Update avatar if file is selected
      if (avatarFile) {
        console.log('🖼️ Uploading avatar file:', avatarFile.name);
        const formDataObj = new FormData()
        formDataObj.append('avatar', avatarFile)
        
        const avatarResponse = await adminProfileAPI.updateAvatar(formDataObj)
        console.log('✅ Avatar update response:', avatarResponse.data)
        
        // Update profile with new avatar path immediately
        if (avatarResponse.data && avatarResponse.data.avatar_path) {
          setProfile(prev => prev ? {
            ...prev,
            avatar: avatarResponse.data.avatar_path
          } : null);
        }
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      })
      
      setIsEditing(false)
      setAvatarFile(null)
      
      // Clean up preview URL
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null)
      }
      
      // Refresh profile data to ensure we have the latest
      console.log('🔄 Refreshing profile data...');
      const response = await adminProfileAPI.getProfile()
      console.log('📊 Fresh profile data:', response.data.profile);
      setProfile(response.data.profile)
      setFormData({
        name: response.data.profile.name,
        email: response.data.profile.email
      })
    } catch (error: any) {
      console.error("❌ Failed to update profile:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ Avatar file selection triggered');
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      console.log('📁 Selected file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setAvatarFile(file)
      
      // Clean up previous preview URL
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      console.log('🔗 Created preview URL:', previewUrl);
      setAvatarPreview(previewUrl)
    } else {
      console.log('❌ No file selected');
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.new_password_confirmation) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields",
        variant: "destructive"
      })
      return
    }

    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match",
        variant: "destructive"
      })
      return
    }

    if (passwordData.new_password.length < 8) {
      toast({
        title: "Validation Error",
        description: "New password must be at least 8 characters long",
        variant: "destructive"
      })
      return
    }

    try {
      setIsChangingPassword(true)
      console.log('🔐 Changing admin password...');
      
      await adminProfileAPI.updatePassword(passwordData)
      
      toast({
        title: "Success",
        description: "Password changed successfully"
      })
      
      setShowPasswordForm(false)
      setPasswordData({
        current_password: "",
        new_password: "",
        new_password_confirmation: ""
      })
    } catch (error: any) {
      console.error("❌ Failed to change password:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to change password",
        variant: "destructive"
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSecuritySettingChange = async (setting: 'ip_restriction' | 'login_notifications', enabled: boolean) => {
    if (setting === 'ip_restriction' && enabled) {
      // Show IP dialog for IP restriction
      try {
        const ipResponse = await adminProfileAPI.getCurrentIp()
        setCurrentIp(ipResponse.data.ip)
        setIpInputs([ipResponse.data.ip])
        setShowIpDialog(true)
      } catch (error) {
        console.error('Failed to get current IP:', error)
        toast({
          title: "Error",
          description: "Failed to get current IP address",
          variant: "destructive"
        })
      }
      return
    }

    try {
      setIsUpdatingSettings(true)
      console.log(`🔒 Updating ${setting} to ${enabled}`);
      
      await adminProfileAPI.updateSecuritySettings({
        setting,
        enabled,
        ...(setting === 'ip_restriction' && !enabled ? { allowed_ips: [] } : {})
      })
      
      setSecuritySettings(prev => ({
        ...prev,
        [`${setting}_enabled`]: enabled
      }))
      
      toast({
        title: "Success",
        description: `${setting.replace('_', ' ')} ${enabled ? 'enabled' : 'disabled'} successfully`
      })
    } catch (error: any) {
      console.error(`❌ Failed to update ${setting}:`, error);
      toast({
        title: "Error",
        description: error.response?.data?.message || `Failed to update ${setting}`,
        variant: "destructive"
      })
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const handleIpRestrictionSave = async () => {
    const validIps = ipInputs.filter(ip => ip.trim() !== '')
    
    if (validIps.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one IP address",
        variant: "destructive"
      })
      return
    }

    try {
      setIsUpdatingSettings(true)
      console.log('🔒 Enabling IP restriction with IPs:', validIps);
      
      await adminProfileAPI.updateSecuritySettings({
        setting: 'ip_restriction',
        enabled: true,
        allowed_ips: validIps
      })
      
      setSecuritySettings(prev => ({
        ...prev,
        ip_restriction_enabled: true,
        allowed_ips: validIps
      }))
      
      setShowIpDialog(false)
      setIpInputs([''])
      
      toast({
        title: "Success",
        description: "IP address restriction enabled successfully"
      })
    } catch (error: any) {
      console.error('❌ Failed to enable IP restriction:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to enable IP restriction",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const addIpInput = () => {
    setIpInputs([...ipInputs, ''])
  }

  const removeIpInput = (index: number) => {
    if (ipInputs.length > 1) {
      setIpInputs(ipInputs.filter((_, i) => i !== index))
    }
  }

  const updateIpInput = (index: number, value: string) => {
    const newInputs = [...ipInputs]
    newInputs[index] = value
    setIpInputs(newInputs)
  }
  
  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const handleCancel = () => {
    console.log('❌ Canceling edit mode');
    setIsEditing(false)
    setAvatarFile(null)
    
    // Clean up preview URL
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null)
    }
    
    // Reset form data to original values
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email
      })
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_action":
        return <User className="h-4 w-4 text-blue-600" />
      case "report":
        return <Activity className="h-4 w-4 text-green-600" />
      case "moderation":
        return <Shield className="h-4 w-4 text-orange-600" />
      case "system":
        return <Settings className="h-4 w-4 text-purple-600" />
      case "login":
        return <User className="h-4 w-4 text-indigo-600" />
      case "profile":
        return <User className="h-4 w-4 text-teal-600" />
      case "security":
        return <Shield className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load profile data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile information and security settings
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isSaving}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={() => isEditing ? handleSave() : setIsEditing(!isEditing)}
            variant={isEditing ? "default" : "outline"}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {avatarPreview ? (
                      <AvatarImage
                        src={avatarPreview}
                        alt={profile.name}
                        onLoad={() => console.log('✅ Preview avatar loaded successfully')}
                        onError={(e) => console.error('❌ Preview avatar failed to load:', e)}
                      />
                    ) : profile.avatar ? (
                      <AvatarImage
                        src={getAvatarUrl(profile.avatar) || ''}
                        alt={profile.name}
                        onLoad={() => console.log('✅ Profile avatar loaded successfully')}
                        onError={(e) => {
                          console.error('❌ Profile avatar failed to load:', {
                            src: e.currentTarget.src,
                            avatar: profile.avatar,
                            avatarUrl: getAvatarUrl(profile.avatar)
                          });
                        }}
                      />
                    ) : (
                      <AvatarFallback className="text-lg">
                        {profile.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {isEditing && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                        asChild
                      >
                        <span>
                          <Camera className="h-4 w-4" />
                        </span>
                      </Button>
                    </label>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  <p className="text-muted-foreground">{profile.role_display}</p>
                  <Badge className="mt-1" variant={profile.is_active ? "default" : "destructive"}>
                    {profile.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {avatarFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📁 {avatarFile.name} selected
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Profile Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="role"
                      value={profile.role_display}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="status"
                      value={profile.is_active ? "Active" : "Inactive"}
                      disabled
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Joined</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Last Login</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.last_login_at 
                        ? new Date(profile.last_login_at).toLocaleString()
                        : "Never"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">IP Address Restriction</div>
                  <div className="text-sm text-muted-foreground">
                    Limit access to specific IP addresses
                    {securitySettings.ip_restriction_enabled && securitySettings.allowed_ips.length > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        <Globe className="h-3 w-3 inline mr-1" />
                        {securitySettings.allowed_ips.length} IP(s) allowed
                      </div>
                    )}
                  </div>
                </div>
                <Switch
                  checked={securitySettings.ip_restriction_enabled}
                  onCheckedChange={(checked) => handleSecuritySettingChange('ip_restriction', checked)}
                  disabled={isUpdatingSettings}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Login Notifications</div>
                  <div className="text-sm text-muted-foreground">Get notified of new login attempts</div>
                </div>
                <Switch
                  checked={securitySettings.login_notifications_enabled}
                  onCheckedChange={(checked) => handleSecuritySettingChange('login_notifications', checked)}
                  disabled={isUpdatingSettings}
                />
              </div>

              {!showPasswordForm ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowPasswordForm(true)}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                      placeholder="Enter current password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.new_password_confirmation}
                      onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})}
                      placeholder="Confirm new password"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordData({
                          current_password: "",
                          new_password: "",
                          new_password_confirmation: ""
                        })
                      }}
                      disabled={isChangingPassword}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Module</TableHead>
                    <TableHead className="text-xs w-12">R</TableHead>
                    <TableHead className="text-xs w-12">W</TableHead>
                    <TableHead className="text-xs w-12">D</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs font-medium">{permission.module}</TableCell>
                      <TableCell className="text-center">
                        {permission.read ? "✓" : "✗"}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.write ? "✓" : "✗"}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.delete ? "✓" : "✗"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      {activity.target && (
                        <p className="text-xs text-muted-foreground">{activity.target}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
                {recentActivity.length > 5 && (
                  <div className="text-center pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Showing 5 of {recentActivity.length} activities
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* IP Address Restriction Dialog */}
      <Dialog open={showIpDialog} onOpenChange={setShowIpDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure IP Address Restriction</DialogTitle>
            <DialogDescription>
              Enter the IP addresses that are allowed to access the admin panel. Your current IP address ({currentIp}) has been automatically added.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Allowed IP Addresses</Label>
              {ipInputs.map((ip, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={ip}
                    onChange={(e) => updateIpInput(index, e.target.value)}
                    placeholder="Enter IP address (e.g., 192.168.1.100)"
                    className="flex-1"
                  />
                  {ipInputs.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeIpInput(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIpInput}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another IP Address
              </Button>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important Security Notice:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Only the specified IP addresses will be able to access the admin panel</li>
                    <li>• Make sure to include your current IP ({currentIp}) to avoid being locked out</li>
                    <li>• You can disable this restriction later if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowIpDialog(false)
                setIpInputs([''])
              }}
              disabled={isUpdatingSettings}
            >
              Cancel
            </Button>
            <Button
              onClick={handleIpRestrictionSave}
              disabled={isUpdatingSettings}
            >
              {isUpdatingSettings ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Enable IP Restriction
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}