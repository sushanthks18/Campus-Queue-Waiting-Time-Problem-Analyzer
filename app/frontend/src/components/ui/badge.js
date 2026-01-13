import React from 'react';

const Badge = ({ children, className = '' }) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  // Extract potential status classes from className to determine default styling
  const hasStatusClass = /bg-(red|green|yellow|blue|indigo|purple|pink)-(500|600)/.test(className);
  
  const defaultClasses = hasStatusClass 
    ? '' 
    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
  
  const classes = `${baseClasses} ${defaultClasses} ${className}`;
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export { Badge };
