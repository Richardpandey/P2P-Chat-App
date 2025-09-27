import { useEffect, useState } from "react";
import { SignIn } from "./SignIn";
import { SignUp } from "./SignUp";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";

export const AuthFlow = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();
  const { theme, setTheme } = useTheme();

  // Force light mode while on auth screens
  useEffect(() => {
    const prevTheme = theme;
    if (prevTheme !== 'light') {
      setTheme('light');
    }
    return () => {
      // Restore previous theme when leaving auth screens
      if (prevTheme && prevTheme !== 'light') {
        setTheme(prevTheme);
      }
    };
  }, []);

  const handleSignIn = (nametag: string) => {
    signIn(nametag);
  };

  const handleSignUp = (nametag: string, gender: string, avatar: string) => {
    signUp(nametag, gender, avatar);
  };

  const switchToSignUp = () => setIsSignUp(true);
  const switchToSignIn = () => setIsSignUp(false);

  return (
    <>
      {isSignUp ? (
        <SignUp
          onSignUp={handleSignUp}
          onSwitchToSignIn={switchToSignIn}
        />
      ) : (
        <SignIn
          onSignIn={handleSignIn}
          onSwitchToSignUp={switchToSignUp}
        />
      )}
    </>
  );
};
