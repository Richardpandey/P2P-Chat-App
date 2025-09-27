import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lock,
  Unlock,
  ImageDown,
  QrCode,
  FileSymlink,
  ScanLine,
  Share2
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  category: 'content' | 'ai' | 'utility' | 'social' | 'security';
  isPopular?: boolean;
  isNew?: boolean;
}

const tools: Tool[] = [
  {
    id: "1",
    name: "Encrypter",
    description: "Encrypt your messages and files with military-grade encryption",
    icon: <Lock className="h-6 w-6" />,
    price: 150,
    category: 'security',
    isPopular: true
  },
  {
    id: "2",
    name: "Decrypter",
    description: "Decrypt encrypted messages and files securely",
    icon: <Unlock className="h-6 w-6" />,
    price: 150,
    category: 'security',
    isPopular: true
  },
  {
    id: "3",
    name: "Steganography",
    description: "Hide secret messages within images or files",
    icon: <ImageDown className="h-6 w-6" />,
    price: 200,
    category: 'security',
    isNew: true
  },
  {
    id: "4",
    name: "QR Generator",
    description: "Create customized QR codes for sharing information",
    icon: <QrCode className="h-6 w-6" />,
    price: 100,
    category: 'utility'
  },
  {
    id: "5",
    name: "File Converter",
    description: "Convert files between different formats easily",
    icon: <FileSymlink className="h-6 w-6" />,
    price: 120,
    category: 'utility'
  },
  {
    id: "6",
    name: "Scanner",
    description: "Scan documents and convert them to digital format",
    icon: <ScanLine className="h-6 w-6" />,
    price: 180,
    category: 'utility',
    isNew: true
  }
];

export const MarketplacePanel = () => {
  return (
    <div className="fixed inset-0 bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="pt-24 pb-6 px-6">
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Discover tools and features to enhance your chat experience</p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Card key={tool.id} className="p-4 flex flex-col bg-card">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {tool.icon}
                </div>
                <div className="flex gap-2">
                  {tool.isNew && (
                    <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">New</Badge>
                  )}
                  {tool.isPopular && (
                    <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">Popular</Badge>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
              <p className="text-muted-foreground text-sm mb-4 flex-1">{tool.description}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <span className="font-semibold">रु{tool.price}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm">Get Tool</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};