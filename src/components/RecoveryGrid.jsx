import React from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

const RecoveryGrid = ({ 
  phrase = ["adapt", "shadow", "reveal", "orbit", "future", "glitch", "matrix", "nexus", "cipher", "pulse", "echo", "void"],
  blurred = false,
  onReveal = null
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(phrase.join(" "));
    toast.success("Recovery phrase copied to clipboard");
  };

  const handleReveal = () => {
    if (onReveal) {
      onReveal();
    }
  };

  return (
    <div className="relative group">
      <div className={`grid grid-cols-3 gap-3 ${blurred ? 'blur-sm select-none' : ''} transition-all duration-300`}>
        {phrase.map((word, index) => (
          <div key={index} className="bg-black/40 border border-white/10 rounded-lg p-3 flex items-center gap-3">
            <span className="text-muted-foreground text-xs font-mono w-4">{index + 1}.</span>
            <span className="text-white font-medium">{word}</span>
          </div>
        ))}
      </div>
      
      {blurred && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={handleReveal}
        >
            <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-sm font-medium hover:bg-black/70 transition-colors">
                Click to reveal
            </div>
        </div>
      )}

      {!blurred && (
        <button 
          onClick={handleCopy}
          className="absolute -top-10 right-0 text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
        >
          <Copy size={14} /> Copy to clipboard
        </button>
      )}
    </div>
  );
};

export default RecoveryGrid;