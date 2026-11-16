import { ReactNode } from 'react';
import './ladder-toolbar.css';

/** The bar above a Warcraft ladder's columns that holds its search and filters. */
export function LadderToolbar({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="ladder-toolbar">{children}</div>;
}
