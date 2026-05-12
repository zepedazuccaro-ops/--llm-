import { useState, useEffect } from 'react';
import { Clock, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { getSystemTime, updateGameTime, formatGameTime, PERIOD_NAMES } from '../systems/clock';

export default function ClockDisplay({ gameTime, setGameTime }) {
  const [sysTime, setSysTime] = useState(getSystemTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setSysTime(getSystemTime());
      setGameTime(prev => updateGameTime(prev, 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [setGameTime]);

  const periodIcon = gameTime.period === 'morning' ? <Sunrise size={13}/> :
    gameTime.period === 'afternoon' ? <Sun size={13}/> :
    gameTime.period === 'evening' ? <Sunset size={13}/> : <Moon size={13}/>;

  return (
    <div className="clock-display">
      <div className="clock-item">
        <Clock size={12}/>
        <span className="clock-time">{sysTime.formatted}</span>
      </div>
      <div className="clock-item">
        {periodIcon}
        <span className="clock-time">{formatGameTime(gameTime)}</span>
        <span className="clock-period">{PERIOD_NAMES[gameTime.period]}</span>
      </div>
    </div>
  );
}
