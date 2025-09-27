import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Send, 
  Copy, 
  ExternalLink,
  AtSign,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface WalletDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletDialog = ({ isOpen, onClose }: WalletDialogProps) => {
  const { user } = useAuth();
  const [walletAddress] = useState("0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6");
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [sendForm, setSendForm] = useState({
    to: "",
    amount: ""
  });
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('andes_wallet_balance');
    return saved ? parseFloat(saved) : 1250.50;
  });

  // Copy wallet address to clipboard
  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    // You could add a toast notification here
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(sendForm.amount);
    
    // Validate amount
    if (amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    if (amount > balance) {
      alert("Insufficient balance");
      return;
    }

    // Update balance
    const newBalance = balance - amount;
    setBalance(newBalance);
    localStorage.setItem('andes_wallet_balance', newBalance.toString());

    // Save transaction to history
    const transaction = {
      id: Date.now().toString(),
      type: 'send',
      amount: sendForm.amount,
      to: sendForm.to,
      timestamp: new Date().toISOString(),
    };

    const transactions = JSON.parse(localStorage.getItem('andes_wallet_transactions') || '[]');
    transactions.unshift(transaction);
    localStorage.setItem('andes_wallet_transactions', JSON.stringify(transactions));

    // Close dialog and reset form
    setIsSendDialogOpen(false);
    setSendForm({ to: "", amount: "" });
  };

  const totalValue = balance;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="relative fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-lg max-h-[85vh] p-0 overflow-hidden gap-0 rounded-2xl bg-gradient-to-b from-red-50/80 via-background to-background dark:from-red-950/10 dark:via-background dark:to-background shadow-lg border border-border/40 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.08] via-transparent to-transparent pointer-events-none" />
        <DialogHeader className="border-b border-border/40 pb-4 pt-6 px-6 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <span className="text-xl font-bold">@{user?.nametag}'s Wallet</span>
            </DialogTitle>
            <Button
              variant="destructive"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl hover:bg-destructive/90 transition-colors z-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Wallet Overview */}
          <Card className="relative overflow-hidden border-none">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/80 via-red-600 to-red-700 blur-2xl opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/10" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-lg font-semibold text-foreground/90">Total Balance</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="space-y-1">
                <div className="text-4xl font-bold text-foreground">
                  रु{totalValue.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Available Balance
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 p-2 rounded-lg backdrop-blur-sm">
                <span>Wallet Address:</span>
                <code className="bg-background/50 px-2 py-1 rounded text-xs font-mono text-foreground">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-6 w-6 p-0 hover:bg-background/80"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex">
            <Button 
              onClick={() => setIsSendDialogOpen(true)}
              className="flex-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Money
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-center">
              <Button variant="outline" className="justify-start border-gray-200">
                <span className="h-4 w-4 mr-2 font-bold">रु</span>
                Buy LOCAL
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Send Money Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-border/40 shadow-lg">
          <DialogHeader className="px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-red-500 to-red-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
                <Send className="h-4 w-4 text-white" />
              </div>
              <span>Send Money</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendSubmit} className="space-y-4 px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-muted-foreground">
                  <AtSign className="h-4 w-4" />
                </span>
                <Input
                  id="recipient"
                  placeholder="wallet address"
                  className="pl-9 rounded-xl"
                  value={sendForm.to}
                  onChange={(e) => setSendForm(prev => ({ ...prev, to: e.target.value.replace('@', '') }))}
                  pattern="^[a-zA-Z0-9_]+$"
                  title="Please enter a valid username (letters, numbers, and underscores only)"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Enter username without @ symbol</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 font-semibold text-muted-foreground">रु</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="pl-8 rounded-xl"
                  value={sendForm.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (parseFloat(value) > balance) {
                      e.target.setCustomValidity("Amount exceeds available balance");
                    } else if (parseFloat(value) <= 0) {
                      e.target.setCustomValidity("Amount must be greater than 0");
                    } else {
                      e.target.setCustomValidity("");
                    }
                    setSendForm(prev => ({ ...prev, amount: value }));
                  }}
                  min="0.01"
                  max={balance}
                  step="0.01"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Available Balance: रु{totalValue.toLocaleString()}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSendDialogOpen(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300"
              >
                Send Money
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
