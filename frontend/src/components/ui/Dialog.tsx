import React from 'react';
import { cn } from '../../utils/cn';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  );
};

const DialogContent: React.FC<DialogContentProps> = ({ className, children, ...props }) => (
  <div
    className={cn(
      "relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 p-6",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
    {...props}
  >
    {children}
  </div>
);

const DialogTitle: React.FC<DialogTitleProps> = ({ className, children, ...props }) => (
  <h2
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h2>
);

const DialogDescription: React.FC<DialogDescriptionProps> = ({ className, children, ...props }) => (
  <p
    className={cn("text-sm text-gray-600", className)}
    {...props}
  >
    {children}
  </p>
);

const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, ...props }) => (
  <button {...props}>
    {children}
  </button>
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
};
