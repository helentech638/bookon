import React from 'react';
import { cn } from '../../utils/cn';

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface PaginationContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface PaginationItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
}

interface PaginationLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isActive?: boolean;
}

interface PaginationPreviousProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

interface PaginationNextProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const Pagination: React.FC<PaginationProps> = ({ className, children, ...props }) => (
  <nav
    className={cn("flex items-center justify-center space-x-2", className)}
    {...props}
  >
    {children}
  </nav>
);

const PaginationContent: React.FC<PaginationContentProps> = ({ className, children, ...props }) => (
  <ul
    className={cn("flex items-center space-x-1", className)}
    {...(props as React.HTMLAttributes<HTMLUListElement>)}
  >
    {children}
  </ul>
);

const PaginationItem: React.FC<PaginationItemProps> = ({ className, children, ...props }) => (
  <li className={cn("", className)} {...props}>
    {children}
  </li>
);

const PaginationLink: React.FC<PaginationLinkProps> = ({ 
  className, 
  isActive, 
  children, 
  ...props 
}) => (
  <button
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      isActive 
        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
        : "hover:bg-accent hover:text-accent-foreground",
      "h-10 px-4 py-2",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const PaginationPrevious: React.FC<PaginationPreviousProps> = ({ 
  className, 
  children = "Previous", 
  ...props 
}) => (
  <button
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      "hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const PaginationNext: React.FC<PaginationNextProps> = ({ 
  className, 
  children = "Next", 
  ...props 
}) => (
  <button
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      "hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
};
