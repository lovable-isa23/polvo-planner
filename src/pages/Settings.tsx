import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Ingredients, IngredientCosts, FlavorType } from '@/types/pastry';
import { DEFAULT_RECIPE, DEFAULT_INGREDIENT_COSTS, DEFAULT_LABOR_RATE } from '@/lib/calculations';
import { useFlavors, DEFAULT_FLAVOR_PRICES, FLAVOR_LABELS, FlavorPricing } from '@/hooks/useFlavors';

interface BusinessProfile {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { getFlavorPrices, updateFlavors, isLoading: flavorsLoading } = useFlavors();
  
  // Ingredient amounts state
  const [recipe, setRecipe] = useState<Ingredients>(DEFAULT_RECIPE);
  
  // Material costs state
  const [costs, setCosts] = useState<IngredientCosts>(DEFAULT_INGREDIENT_COSTS);
  
  // Labor state
  const [laborRate, setLaborRate] = useState(DEFAULT_LABOR_RATE);
  
  // Flavor pricing state
  const [flavorPrices, setFlavorPrices] = useState<Record<FlavorType, number>>(DEFAULT_FLAVOR_PRICES);
  
  // Business profile state
  const [profile, setProfile] = useState<BusinessProfile>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
  });

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch preferences from database
      const { data: prefs, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading preferences:', error);
        return;
      }

      if (prefs) {
        setRecipe(prefs.recipe as unknown as Ingredients);
        setCosts(prefs.ingredient_costs as unknown as IngredientCosts);
        setLaborRate(Number(prefs.labor_rate));
        setFlavorPrices(prefs.flavor_prices as unknown as Record<FlavorType, number>);
        setProfile({
          businessName: prefs.business_name || '',
          ownerName: prefs.owner_name || '',
          email: prefs.email || user.email || '',
          phone: prefs.phone || '',
        });
      } else {
        // Set default email from logged-in user
        setProfile(prev => ({ ...prev, email: user.email || '' }));
      }
      
      // Load flavor prices from database
      if (!flavorsLoading) {
        setFlavorPrices(getFlavorPrices());
      }
    };
    
    loadSettings();
  }, [flavorsLoading]);

  const handleSavePreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save flavor prices to database
    const flavorsToSave: FlavorPricing[] = Object.entries(flavorPrices).map(([name, price]) => ({
      name: name as FlavorType,
      pricePerBatch: price,
    }));
    
    await updateFlavors(flavorsToSave);

    // Save preferences to database
    const { error } = await supabase
      .from('preferences')
      .upsert({
        user_id: user.id,
        recipe: recipe as unknown as Json,
        ingredient_costs: costs as unknown as Json,
        labor_rate: laborRate,
        flavor_prices: flavorPrices as unknown as Json,
        business_name: profile.businessName,
        owner_name: profile.ownerName,
        email: profile.email,
        phone: profile.phone,
      });

    if (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
      return;
    }

    toast.success('Preferences saved successfully');
  };

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('preferences')
      .upsert({
        user_id: user.id,
        recipe: recipe as unknown as Json,
        ingredient_costs: costs as unknown as Json,
        labor_rate: laborRate,
        flavor_prices: flavorPrices as unknown as Json,
        business_name: profile.businessName,
        owner_name: profile.ownerName,
        email: profile.email,
        phone: profile.phone,
      });

    if (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
      return;
    }

    toast.success('Business profile saved successfully');
  };

  const handleResetPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setRecipe(DEFAULT_RECIPE);
    setCosts(DEFAULT_INGREDIENT_COSTS);
    setLaborRate(DEFAULT_LABOR_RATE);
    setFlavorPrices(DEFAULT_FLAVOR_PRICES);

    // Reset in database
    const { error } = await supabase
      .from('preferences')
      .upsert({
        user_id: user.id,
        recipe: DEFAULT_RECIPE as unknown as Json,
        ingredient_costs: DEFAULT_INGREDIENT_COSTS as unknown as Json,
        labor_rate: DEFAULT_LABOR_RATE,
        flavor_prices: DEFAULT_FLAVOR_PRICES as unknown as Json,
        business_name: profile.businessName,
        owner_name: profile.ownerName,
        email: profile.email,
        phone: profile.phone,
      });

    if (error) {
      console.error('Error resetting preferences:', error);
      toast.error('Failed to reset preferences');
      return;
    }

    toast.success('Preferences reset to defaults');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your preferences and business profile</p>
          </div>
        </div>

        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="profile">Business Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recipe - Ingredient Amounts</CardTitle>
                <CardDescription>Default amounts per order (10 pastries)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="flour">Flour (cups)</Label>
                    <Input
                      id="flour"
                      type="number"
                      step="0.1"
                      value={recipe.flour}
                      onChange={(e) => setRecipe({ ...recipe, flour: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="powderedMilk">Powdered Milk (cups)</Label>
                    <Input
                      id="powderedMilk"
                      type="number"
                      step="0.1"
                      value={recipe.powderedMilk}
                      onChange={(e) => setRecipe({ ...recipe, powderedMilk: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pinipig">Pinipig (cups)</Label>
                    <Input
                      id="pinipig"
                      type="number"
                      step="0.1"
                      value={recipe.pinipig}
                      onChange={(e) => setRecipe({ ...recipe, pinipig: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="butter">Butter (cups)</Label>
                    <Input
                      id="butter"
                      type="number"
                      step="0.1"
                      value={recipe.butter}
                      onChange={(e) => setRecipe({ ...recipe, butter: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sugar">Sugar (cups)</Label>
                    <Input
                      id="sugar"
                      type="number"
                      step="0.1"
                      value={recipe.sugar}
                      onChange={(e) => setRecipe({ ...recipe, sugar: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material Costs</CardTitle>
                <CardDescription>Cost per cup of each ingredient</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="flourCost">Flour ($)</Label>
                    <Input
                      id="flourCost"
                      type="number"
                      step="0.01"
                      value={costs.flour}
                      onChange={(e) => setCosts({ ...costs, flour: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="powderedMilkCost">Powdered Milk ($)</Label>
                    <Input
                      id="powderedMilkCost"
                      type="number"
                      step="0.01"
                      value={costs.powderedMilk}
                      onChange={(e) => setCosts({ ...costs, powderedMilk: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pinipigCost">Pinipig ($)</Label>
                    <Input
                      id="pinipigCost"
                      type="number"
                      step="0.01"
                      value={costs.pinipig}
                      onChange={(e) => setCosts({ ...costs, pinipig: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="butterCost">Butter ($)</Label>
                    <Input
                      id="butterCost"
                      type="number"
                      step="0.01"
                      value={costs.butter}
                      onChange={(e) => setCosts({ ...costs, butter: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sugarCost">Sugar ($)</Label>
                    <Input
                      id="sugarCost"
                      type="number"
                      step="0.01"
                      value={costs.sugar}
                      onChange={(e) => setCosts({ ...costs, sugar: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flavor Pricing</CardTitle>
                <CardDescription>Price per batch (10 pastries) for each flavor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(FLAVOR_LABELS).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`flavor-${key}`}>{label}</Label>
                      <Input
                        id={`flavor-${key}`}
                        type="number"
                        step="0.01"
                        value={flavorPrices[key as FlavorType]}
                        onChange={(e) => 
                          setFlavorPrices(prev => ({
                            ...prev,
                            [key]: parseFloat(e.target.value) || 0
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Labor Rate</CardTitle>
                <CardDescription>Default labor rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="laborRate">Labor Rate ($/hour)</Label>
                  <Input
                    id="laborRate"
                    type="number"
                    step="0.1"
                    value={laborRate}
                    onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handleSavePreferences}>Save Preferences</Button>
              <Button variant="outline" onClick={handleResetPreferences}>Reset to Defaults</Button>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Your business details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={profile.businessName}
                    onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                    placeholder="Enter your business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    value={profile.ownerName}
                    onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })}
                    placeholder="Enter owner name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="business@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveProfile}>Save Profile</Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
