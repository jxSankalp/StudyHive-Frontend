import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/30">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <TopBar />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background/50">
          <div className="h-full relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
