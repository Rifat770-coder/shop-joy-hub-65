 import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { account } from '@/integrations/appwrite/config';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const recoveryUserId = searchParams.get('userId');
  const recoverySecret = searchParams.get('secret');
  const isRecoveryMode = Boolean(recoveryUserId && recoverySecret);
  const isResetRequestMode = isResetMode && !isRecoveryMode;

  useEffect(() => {
    if (user && !isRecoveryMode && !isResetMode) {
      navigate('/');
    }
  }, [user, navigate, isRecoveryMode, isResetMode]);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    setIsResetMode(modeParam === 'reset');
  }, [location.search]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (isResetRequestMode) {
      try { emailSchema.parse(email); } catch (e) { if (e instanceof z.ZodError) newErrors.email = e.errors[0].message; }
    } else if (isRecoveryMode) {
      try { passwordSchema.parse(password); } catch (e) { if (e instanceof z.ZodError) newErrors.password = e.errors[0].message; }
      if (password !== confirmPassword) newErrors.password = 'Passwords do not match';
    } else {
      try { emailSchema.parse(email); } catch (e) { if (e instanceof z.ZodError) newErrors.email = e.errors[0].message; }
      try { passwordSchema.parse(password); } catch (e) { if (e instanceof z.ZodError) newErrors.password = e.errors[0].message; }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (isRecoveryMode) {
        if (!recoveryUserId || !recoverySecret) {
          toast({ title: 'Invalid recovery link', description: 'Please request a new password reset link.', variant: 'destructive' });
          return;
        }
        await account.updateRecovery(recoveryUserId, recoverySecret, password);
        toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
        setPassword(''); setConfirmPassword(''); setIsResetMode(false); navigate('/auth');
        return;
      }
      if (isResetRequestMode) {
        const recoveryUrl = new URL(`${window.location.origin}/auth`);
        recoveryUrl.searchParams.set('mode', 'recovery');
        await account.createRecovery(email.trim(), recoveryUrl.toString());
        toast({ title: 'Reset link sent', description: 'Check your email for the password reset link.' });
        setEmail(''); setIsResetMode(false); navigate('/auth');
        return;
      }
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: 'Login failed', description: error.message.includes('Invalid login credentials') ? 'Invalid email or password. Please try again.' : error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({ title: error.message.includes('User already registered') ? 'Account exists' : 'Signup failed', description: error.message.includes('User already registered') ? 'An account with this email already exists. Please log in instead.' : error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Account created!', description: 'Welcome to RealGadget BD! You can now start shopping.' });
          navigate('/profile?setup=1');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex animate-fade-in">
      {/* Form side — dark navy on mobile only */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24 bg-[#0d1117] sm:bg-background">
        <div className="max-w-md w-full mx-auto">

          <Link to="/" className="inline-flex items-center gap-2 mb-10 text-slate-500 sm:text-muted-foreground hover:text-slate-300 sm:hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to store
          </Link>

          <div className="mb-8">
            <Link to="/" className="flex items-center gap-3 mb-8">
              {/* Shopping bag icon — matches the image exactly on mobile */}
              <div className="h-11 w-11 rounded-xl bg-slate-800 sm:hidden flex items-center justify-center border border-slate-700">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              {/* Original logo — desktop only */}
              <img src="/2.png" alt="RealGadget BD" className="h-10 w-10 rounded-lg object-contain hidden sm:block" />
              <span className="text-2xl font-bold text-white sm:text-foreground">
                RealGadget <span className="text-primary">BD</span>
              </span>
            </Link>
            <h1 className="text-[1.85rem] font-black text-white sm:text-foreground leading-tight">
              {isRecoveryMode ? 'Reset your password' : isResetRequestMode ? 'Forgot password' : isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="mt-2 text-slate-500 sm:text-muted-foreground text-sm">
              {isRecoveryMode ? 'Enter a new password for your account' : isResetRequestMode ? 'We will send a reset link to your email' : isLogin ? 'Enter your credentials to access your account' : 'Sign up to start shopping with us'}
            </p>
          </div>

          <form key={isLogin ? 'login' : 'signup'} onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && !isResetRequestMode && !isRecoveryMode && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-400 sm:text-foreground text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 sm:text-muted-foreground" />
                  <Input id="fullName" type="text" placeholder="John Doe" value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-[#1a2235] border-[#2a3550] text-white placeholder:text-slate-600 rounded-xl h-12 sm:bg-background sm:border-border sm:text-foreground sm:placeholder:text-muted-foreground sm:rounded-md sm:h-10" />
                </div>
              </div>
            )}

            {!isRecoveryMode && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-400 sm:text-foreground text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 sm:text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                    className={`pl-10 bg-[#1a2235] border-[#2a3550] text-white placeholder:text-slate-600 rounded-xl h-12 sm:bg-background sm:border-border sm:text-foreground sm:placeholder:text-muted-foreground sm:rounded-md sm:h-10 ${errors.email ? 'border-destructive' : ''}`} />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
            )}

            {!isResetRequestMode && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-400 sm:text-foreground text-sm font-medium">{isRecoveryMode ? 'New Password' : 'Password'}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 sm:text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    className={`pl-10 pr-10 bg-[#1a2235] border-[#2a3550] text-white placeholder:text-slate-600 rounded-xl h-12 sm:bg-background sm:border-border sm:text-foreground sm:placeholder:text-muted-foreground sm:rounded-md sm:h-10 ${errors.password ? 'border-destructive' : ''}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 sm:text-muted-foreground hover:text-slate-300 sm:hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
            )}

            {isRecoveryMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-400 sm:text-foreground text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 sm:text-muted-foreground" />
                  <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    className={`pl-10 bg-[#1a2235] border-[#2a3550] text-white placeholder:text-slate-600 rounded-xl h-12 sm:bg-background sm:border-border sm:text-foreground sm:rounded-md sm:h-10 ${errors.password ? 'border-destructive' : ''}`} />
                </div>
              </div>
            )}

            {isLogin && !isResetRequestMode && !isRecoveryMode && (
              <div className="text-right">
                <button type="button" onClick={() => { setIsResetMode(true); setErrors({}); setPassword(''); setConfirmPassword(''); navigate('/auth?mode=reset'); }}
                  className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" variant="hero" size="lg"
              className="w-full relative overflow-hidden sm:h-10 h-12 sm:rounded-md rounded-xl text-base font-bold"
              disabled={isLoading}>
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                {isRecoveryMode ? 'Reset Password' : isResetRequestMode ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
              </span>
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 sm:text-muted-foreground text-sm">
              {isRecoveryMode || isResetRequestMode ? (
                <button type="button" onClick={() => { setIsResetMode(false); setIsLogin(true); setErrors({}); setEmail(''); setPassword(''); setConfirmPassword(''); navigate('/auth'); }}
                  className="text-primary hover:underline font-medium">
                  Back to sign in
                </button>
              ) : (
                <>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setErrors({}); setEmail(''); setPassword(''); setConfirmPassword(''); setFullName(''); }}
                    className="ml-1 text-primary hover:underline font-semibold">
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </>
              )}
            </p>
          </div>

        </div>
      </div>

      {/* Right side — desktop only, zero change */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src="/2.png" alt="RealGadget BD" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-start justify-center p-12 pt-16">
          <div className="text-center text-primary-foreground max-w-md">
            <h2 className="text-4xl font-bold mb-4">Shop the Best Deals</h2>
            <p className="text-lg opacity-90">Join thousands of happy customers and discover amazing products at unbeatable prices.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
