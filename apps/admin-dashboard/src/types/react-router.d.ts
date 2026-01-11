declare module 'react-router-dom' {
  import * as React from 'react';
  
  export interface RouteProps {
    path?: string;
    element?: React.ReactNode;
    children?: React.ReactNode;
  }
  
  export interface RoutesProps {
    children?: React.ReactNode;
    location?: any;
  }
  
  export const Route: React.FC<RouteProps>;
  export const Routes: React.FC<RoutesProps>;
  export const BrowserRouter: React.FC<{ children?: React.ReactNode }>;
  export const Navigate: React.FC<{ to: string; replace?: boolean }>;
}