import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleIcon from '@mui/icons-material/AddCircle';

export const NAVIGATION = [
  { segment: '', title: 'Home', icon: <DashboardIcon /> },
  { segment: 'create-memory', title: 'Create Memory', icon: <AddCircleIcon /> },
  { segment: 'people', title: 'People', icon: <PeopleIcon /> },
  { segment: 'stats', title: 'Statistics', icon: <BarChartIcon /> },
]; 