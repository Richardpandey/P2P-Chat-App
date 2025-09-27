import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogIn } from "lucide-react";
import appLogo from "@/assets/logo.png";

interface SignInProps {
  onSignIn: (nametag: string) => void;
  onSwitchToSignUp: () => void;
}

export const SignIn = ({ onSignIn, onSwitchToSignUp }: SignInProps) => {
  const [nametag, setNametag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nametag.trim()) return;

    setIsLoading(true);
    setError(null);
    // Simulate API call
    setTimeout(() => {
      try {
        onSignIn(nametag.trim());
      } catch (e) {
        setError('Account not found. Please sign up.');
      } finally {
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto rounded-2xl w-fit">
            <img src={appLogo} alt="App Logo" className="h-12 w-auto mx-auto select-none" draggable={false} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
              Welcome Back to ANDES
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Sign in to continue your conversations
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nametag" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Nametag
              </label>
              <Input
                id="nametag"
                type="text"
                placeholder="Enter your nametag"
                value={nametag}
                onChange={(e) => { setNametag(e.target.value); if (error) setError(null); }}
                className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            
            <Button
              type="submit"
              disabled={!nametag.trim() || isLoading}
              className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </div>
              )}
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={onSwitchToSignUp}
                className="text-red-600 hover:text-red-700 font-semibold hover:underline transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500">
        Project by Richard | Github: <a href="https://github.com/Richardpandey" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">https://github.com/Richardpandey</a>
      </div>
    </div>
  );
};
