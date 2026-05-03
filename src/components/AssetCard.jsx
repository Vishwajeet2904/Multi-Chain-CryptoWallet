import { ArrowUpRight, ArrowDownRight, TrendingUp, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AssetCard = ({ id, name, symbol, amount, value, price, change, icon, color, loading, isTestnet }) => {
  const navigate = useNavigate();
  const isPositive = change >= 0;

  return (
    <div 
        onClick={() => navigate(`/coin/${id}`)}
        className="glass rounded-2xl p-5 border border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
    >
        {/* Glow Effect */}
        <div 
            className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"
            style={{ backgroundColor: color }}
        />

        <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg`} style={{ backgroundColor: color }}>
                    {symbol[0]}
                </div>
                <div>
                    <h3 className="font-semibold text-white leading-none">{name}</h3>
                    <span className="text-sm text-muted-foreground">{symbol}</span>
                </div>
            </div>
            
            {/* Testnet badge OR price change badge */}
            {isTestnet ? (
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <FlaskConical size={12} />
                    Testnet
                </div>
            ) : (
                <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {typeof change === 'number' ? change.toFixed(2) : change}%
                </div>
            )}
        </div>

        <div className="relative z-10">
            {loading ? (
                <>
                    <div className="animate-pulse bg-white/20 h-8 w-32 rounded mb-2"></div>
                    <div className="animate-pulse bg-white/10 h-4 w-24 rounded"></div>
                </>
            ) : (
                <>
                    <div className="flex items-baseline justify-between">
                        {/* Testnet: show balance only, no dollar value */}
                        {isTestnet ? (
                            <h4 className="text-2xl font-bold text-white mb-1">{amount} <span className="text-lg text-orange-400">{symbol}</span></h4>
                        ) : (
                            <h4 className="text-2xl font-bold text-white mb-1">{value}</h4>
                        )}
                        <span className="text-xs text-gray-500 font-medium">
                            {isTestnet ? 'No real value' : `Price: ${price}`}
                        </span>
                    </div>
                    {!isTestnet && (
                        <p className="text-sm text-muted-foreground">{amount} {symbol}</p>
                    )}
                    {isTestnet && (
                        <p className="text-xs text-orange-400/70 mt-1">Free testnet tokens for development</p>
                    )}
                </>
            )}
        </div>


        {/* Mini Chart Decoration */}
        <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={48} />
        </div>
    </div>
  );
};

export default AssetCard;