import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User, 
  Shield, 
  Bell, 
  Globe, 
  Building, 
  Smartphone, 
  Camera, 
  Save, 
  LogOut, 
  Trash2, 
  Eye, 
  EyeOff,
  Upload,
  AlertTriangle,
  Monitor
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAvatarUrl } from '@/utils/storage';

const Settings: React.FC = () => {
  const { user, logout, logoutFromAllDevices, changePassword, deleteAccount, updateUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLogoutAllDialogOpen, setIsLogoutAllDialogOpen] = useState(false);
  const [isEmailWarningDialogOpen, setIsEmailWarningDialogOpen] = useState(false);
  const [pendingEmailSetting, setPendingEmailSetting] = useState<{key: string, value: boolean} | null>(null);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.contact_number || '',
    company: user?.company || '',
    taxId: user?.tax_id || '',
    avatar: user?.avatar || ''
  });

  // Security form state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  // Combined Preferences & Notifications
  const [settings, setSettings] = useState({
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    productUpdates: true,
    // Preference settings
    language: 'english',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    // Email notification preferences (enabled by default)
    welcomeEmails: true,
    subscriptionEmails: true,
    usageWarningEmails: true,
    securityEmailAlerts: true,
    accountDeletionEmails: true,
    passwordResetEmails: true
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 2MB.',
          variant: 'destructive',
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a valid image file.',
          variant: 'destructive',
        });
        return;
      }
      
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async () => {
    try {
      setIsLoading(true);
      
      // Create FormData for file upload and profile data
      const formData = new FormData();
      
      // Add profile data to FormData
      if (profileData.name !== user?.name) {
        formData.append('name', profileData.name);
      }
      if (profileData.email !== user?.email) {
        formData.append('email', profileData.email);
      }
      if (profileData.company !== user?.company) {
        formData.append('company', profileData.company || '');
      }
      if (profileData.phone !== user?.contact_number) {
        formData.append('contact_number', profileData.phone || '');
      }
      if (profileData.taxId !== user?.tax_id) {
        formData.append('tax_id', profileData.taxId || '');
      }
      
      // Add image file if selected
      if (profileImageFile) {
        formData.append('avatar', profileImageFile);
        console.log('Avatar file being uploaded:', {
          name: profileImageFile.name,
          size: profileImageFile.size,
          type: profileImageFile.type
        });
      }
      
      // Only make API call if there are changes
      if (formData.has('name') || formData.has('email') || formData.has('company') ||
          formData.has('contact_number') || formData.has('tax_id') || formData.has('avatar')) {
        console.log('Sending profile update request...');
        const response = await updateUser(formData);
        console.log('Profile update response:', response);
        
        // Update profile data with the response - the AuthContext is automatically updated by updateUser
        if (response?.user) {
          console.log('Updated user data:', {
            avatar: response.user.avatar,
            name: response.user.name
          });
          
          setProfileData({
            name: response.user.name || '',
            email: response.user.email || '',
            phone: response.user.contact_number || '',
            company: response.user.company || '',
            taxId: response.user.tax_id || '',
            avatar: response.user.avatar || ''
          });
        }
        
        // Clear the image file and preview after successful upload
        setProfileImageFile(null);
        setProfileImagePreview('');
        
        toast({
          title: 'Profile Updated',
          description: 'Your profile information has been saved successfully.',
        });
      } else {
        toast({
          title: 'No Changes',
          description: 'No changes were made to your profile.',
        });
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await changePassword(passwordData);
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  const handleLogoutFromAllDevices = async () => {
    try {
      setIsLoading(true);
      await logoutFromAllDevices();
      toast({
        title: 'Logged Out from All Devices',
        description: 'You have been successfully logged out from all devices.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to logout from all devices.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsLogoutAllDialogOpen(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      toast({
        title: 'Error',
        description: 'Please enter your password to confirm account deletion.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await deleteAccount(deleteAccountPassword);
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setDeleteAccountPassword('');
    }
  };

  // Handle email notification setting changes with security warning
  const handleEmailSettingChange = (key: string, checked: boolean) => {
    const securityEmailTypes = ['securityEmailAlerts', 'passwordResetEmails', 'accountDeletionEmails'];
    
    if (!checked && securityEmailTypes.includes(key)) {
      // Show warning dialog for security-related emails
      setPendingEmailSetting({ key, value: checked });
      setIsEmailWarningDialogOpen(true);
    } else {
      // Direct update for non-security emails
      setSettings(prev => ({ ...prev, [key]: checked }));
    }
  };

  // Confirm disabling security emails
  const confirmDisableSecurityEmail = () => {
    if (pendingEmailSetting) {
      setSettings(prev => ({ ...prev, [pendingEmailSetting.key]: pendingEmailSetting.value }));
    }
    setIsEmailWarningDialogOpen(false);
    setPendingEmailSetting(null);
  };

  // Cancel disabling security emails
  const cancelDisableSecurityEmail = () => {
    setIsEmailWarningDialogOpen(false);
    setPendingEmailSetting(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-8">
        <div className="relative">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-sidebar-background to-card border border-sidebar-border/50 p-1 h-14 rounded-xl shadow-lg backdrop-blur-sm">
            <TabsTrigger 
              value="profile" 
              className="flex items-center gap-2 h-full rounded-lg transition-all duration-300 hover:scale-105 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:scale-105"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex items-center gap-2 h-full rounded-lg transition-all duration-300 hover:scale-105 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:scale-105"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="flex items-center gap-2 h-full rounded-lg transition-all duration-300 hover:scale-105 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:scale-105"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture Card */}
            <Card className="card-elevated hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage
                    src={profileImagePreview || (user?.avatar ? `${getAvatarUrl(user.avatar)}?t=${Date.now()}` : null)}
                    onError={(e) => {
                      console.error('Avatar image failed to load:', {
                        src: e.currentTarget.src,
                        profileImagePreview,
                        userAvatar: user?.avatar,
                        constructedUrl: user?.avatar ? `${getAvatarUrl(user.avatar)}?t=${Date.now()}` : null
                      });
                    }}
                    onLoad={() => {
                      console.log('Avatar image loaded successfully:', {
                        src: profileImagePreview || (user?.avatar ? `${getAvatarUrl(user.avatar)}?t=${Date.now()}` : null)
                      });
                    }}
                  />
                  <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">Profile Picture</CardTitle>
                <CardDescription>
                  Update your profile image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New
                  </Button>
                  {profileImageFile && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setProfileImageFile(null);
                        setProfileImagePreview('');
                      }}
                    >
                      Remove Selected
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
                {profileImageFile && (
                  <p className="text-sm text-green-600 text-center">
                    Selected: {profileImageFile.name}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Personal Information Card */}
            <Card className="lg:col-span-2 card-elevated hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="animate-pulse">
                        {user?.membership_plan?.name || 'Basic'}
                      </Badge>
                      <Badge variant="outline">
                        User
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Company Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Company Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        value={profileData.company}
                        onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Enter company name"
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID (Optional)</Label>
                      <Input
                        id="taxId"
                        value={profileData.taxId}
                        onChange={(e) => setProfileData(prev => ({ ...prev, taxId: e.target.value }))}
                        placeholder="Enter tax identification number"
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleProfileSave} 
                    className="btn-gradient hover:scale-105 transition-all duration-200"
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password & Security
              </CardTitle>
              <CardDescription>
                Manage your password and security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.new_password_confirmation}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password_confirmation: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handlePasswordChange}
                  className="btn-gradient hover:scale-105 transition-all duration-200"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </CardContent>
          </Card>

            <Card className="card-elevated hover:shadow-glow transition-all duration-300 hover:scale-[1.02] border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible account actions. Proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                <div>
                  <h4 className="font-medium">Logout from all devices</h4>
                  <p className="text-sm text-muted-foreground">
                    Sign out from all devices and browsers
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsLogoutAllDialogOpen(true)}
                  disabled={isLoading}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Logout All
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                <div>
                  <h4 className="font-medium text-destructive">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 animate-fade-in">
          <Card className="card-elevated hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about important updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries({
                emailNotifications: { 
                  title: 'Email Notifications', 
                  description: 'Receive notifications via email' 
                },
                pushNotifications: { 
                  title: 'Push Notifications', 
                  description: 'Receive push notifications in your browser' 
                },
                marketingEmails: { 
                  title: 'Marketing Emails', 
                  description: 'Receive promotional and marketing emails' 
                },
                securityAlerts: { 
                  title: 'Security Alerts', 
                  description: 'Get notified about security-related events' 
                },
                productUpdates: { 
                  title: 'Product Updates', 
                  description: 'Stay informed about new features and improvements' 
                }
              }).map(([key, { title, description }]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{title}</Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={settings[key as keyof typeof settings] as boolean}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        [key]: checked
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={() => {
                // Handle saving notifications settings
                toast({
                  title: 'Success',
                  description: 'Notification preferences saved successfully.',
                });
              }}
              className="btn-gradient hover:scale-105 transition-all duration-200"
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6 animate-fade-in">
          <Card className="card-elevated hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Email Notification Preferences
              </CardTitle>
              <CardDescription>
                Control which email notifications you receive. Security-related emails are enabled by default for your protection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries({
                welcomeEmails: {
                  title: 'Welcome Emails',
                  description: 'Receive welcome emails when you join or complete registration',
                  isSecurityRelated: false
                },
                subscriptionEmails: {
                  title: 'Subscription Emails',
                  description: 'Get notified about subscription changes, renewals, and cancellations',
                  isSecurityRelated: false
                },
                usageWarningEmails: {
                  title: 'Usage Warning Emails',
                  description: 'Receive alerts when approaching usage limits',
                  isSecurityRelated: false
                },
                securityEmailAlerts: {
                  title: 'Security Alert Emails',
                  description: 'Critical security notifications and suspicious activity alerts',
                  isSecurityRelated: true
                },
                accountDeletionEmails: {
                  title: 'Account Deletion Emails',
                  description: 'Notifications about account deletion requests and confirmations',
                  isSecurityRelated: true
                },
                passwordResetEmails: {
                  title: 'Password Reset Emails',
                  description: 'Password reset confirmations and OTP codes',
                  isSecurityRelated: true
                }
              }).map(([key, { title, description, isSecurityRelated }]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label>{title}</Label>
                      {isSecurityRelated && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Security
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={settings[key as keyof typeof settings] as boolean}
                    onCheckedChange={(checked) => handleEmailSettingChange(key, checked)}
                  />
                </div>
              ))}
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Disabling security-related email notifications may compromise your account security.
                  You will not receive important alerts about suspicious activities or password changes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={() => {
                // Handle saving preferences settings
                toast({
                  title: 'Success',
                  description: 'Preferences saved successfully.',
                });
              }}
              className="btn-gradient hover:scale-105 transition-all duration-200"
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </TabsContent>

      </Tabs>

      {/* Logout from All Devices Confirmation Dialog */}
      <Dialog open={isLogoutAllDialogOpen} onOpenChange={setIsLogoutAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout from All Devices</DialogTitle>
            <DialogDescription>
              This will sign you out from all devices and browsers. You'll need to sign in again on each device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoutAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLogoutFromAllDevices} 
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? 'Logging out...' : 'Logout from All Devices'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-password">Confirm your password</Label>
              <Input
                id="delete-password"
                type="password"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                placeholder="Enter your password to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeleteAccountPassword('');
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={isLoading || !deleteAccountPassword}
            >
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Security Warning Dialog */}
      <Dialog open={isEmailWarningDialogOpen} onOpenChange={setIsEmailWarningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Disable Security Email Notifications?
            </DialogTitle>
            <DialogDescription>
              You are about to disable important security email notifications. This means you will not receive:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Security alerts about suspicious account activity</li>
                <li>Password reset confirmations and OTP codes</li>
                <li>Account deletion requests and confirmations</li>
                <li>Login notifications from new devices</li>
              </ul>
              <br />
              <strong>This may compromise your account security.</strong> Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDisableSecurityEmail}>
              Keep Enabled (Recommended)
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDisableSecurityEmail}
            >
              Yes, Disable Security Emails
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;