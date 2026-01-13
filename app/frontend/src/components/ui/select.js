import React, { useState } from 'react';

const Select = ({ children, value, onValueChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');

  const handleValueChange = (newValue) => {
    setInternalValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (child.type.displayName === 'SelectTrigger') {
          return React.cloneElement(child, { 
            value: internalValue,
            onClick: () => setIsOpen(!isOpen)
          });
        }
        if (child.type.displayName === 'SelectContent') {
          return React.cloneElement(child, { 
            isOpen,
            onValueChange: handleValueChange,
            currentValue: internalValue
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectTrigger = ({ children, value, onClick }) => {
  return (
    <div 
      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
      onClick={onClick}
    >
      {value || children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 opacity-50"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
};

SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = ({ children, isOpen, onValueChange, currentValue }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 mt-1 w-full">
      <div className="relative p-1">
        {React.Children.map(children, (child) => {
          if (child.type.displayName === 'SelectItem') {
            return React.cloneElement(child, { 
              onSelect: onValueChange,
              isSelected: child.props.value === currentValue
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

SelectContent.displayName = 'SelectContent';

const SelectItem = ({ children, value, onSelect, isSelected }) => {
  return (
    <div
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground ${
        isSelected ? 'bg-accent text-accent-foreground' : ''
      }`}
      onClick={() => onSelect(value)}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </span>
      <span className="ml-2 block truncate">{children}</span>
    </div>
  );
};

SelectItem.displayName = 'SelectItem';

const SelectValue = ({ placeholder }) => {
  return <span>{placeholder}</span>;
};

SelectValue.displayName = 'SelectValue';

Select.SelectTrigger = SelectTrigger;
Select.SelectContent = SelectContent;
Select.SelectItem = SelectItem;
Select.SelectValue = SelectValue;

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
