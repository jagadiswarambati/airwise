import { type AppRoute } from '../../state/route';
import { type IconName } from '../icons';

export interface NavItem {
  id: AppRoute;
  label: string;
  icon: IconName;
}

export const MAIN_NAV_ITEMS: readonly NavItem[] = [
  { id: 'today', label: 'Today', icon: 'clear' },
  { id: 'indoor', label: 'At home', icon: 'home' },
  { id: 'move', label: 'Travel', icon: 'car' },
  { id: 'impact', label: 'Impact', icon: 'chart' },
  { id: 'community', label: 'Community', icon: 'people' },
];
