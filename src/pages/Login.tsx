import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoginCarousel } from "@/components/LoginCarousel";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Check if user is already logged in and set initial tab
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
    
    // Set initial tab based on URL parameter
    const tab = searchParams.get('tab');
    const ref = searchParams.get('ref');
    if (tab === 'signup') {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
    
    // Set referral code from URL
    if (ref) {
      setReferralCode(ref);
      setIsSignUp(true); // Default to signup if referral code present
    }
  }, [navigate, searchParams]);

  const generateDeviceId = () => {
    const stored = localStorage.getItem('deviceId');
    if (stored) return stored;
    
    const deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
    return deviceId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName
            }
          }
        });

        if (error) throw error;

        // Process referral if code provided
        if (referralCode && data.user) {
          const deviceId = generateDeviceId();
          
          // Wait for user to be fully created then process referral
          setTimeout(async () => {
            try {
              const { data: referralResult, error: refError } = await supabase
                .rpc('process_referral', {
                  referral_code_input: referralCode,
                  device_id_input: deviceId
                });
              
              if (refError) {
                console.error('Referral processing error:', refError);
              } else if (referralResult && typeof referralResult === 'object' && 'success' in referralResult && referralResult.success) {
                toast({
                  title: "Referral Applied!",
                  description: "You've been successfully referred!"
                });
              }
            } catch (err) {
              console.error('Error processing referral:', err);
            }
          }, 2000);
        }

        toast({
          title: "Account created successfully",
          description: `Welcome to FairMoney Pay! Please check your email to verify your account.`
        });
        
        navigate("/dashboard");
      } else {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
        
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Top Carousel Section */}
        <div className="mb-6">
          <LoginCarousel />
        </div>

        {/* Login Form Card */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {/* Tab Navigation */}
            <div className="flex">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-200 ${
                  !isSignUp 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                LOGIN
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-200 ${
                  isSignUp 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                CREATE ACCOUNT
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-14 text-base border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        id="referralCode"
                        type="text"
                        placeholder="Referral Code (Optional)"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="h-14 text-base border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 text-base border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 text-base border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white text-base font-medium rounded-xl transition-colors duration-200 shadow-lg" 
                  disabled={loading}
                >
                  {loading ? "Processing..." : isSignUp ? "CREATE ACCOUNT" : "LOGIN"}
                </Button>
              </form>
              
              {!isSignUp && (
                <div className="text-center mt-6">
                  <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors duration-200">
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;