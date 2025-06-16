import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleIcon from '@mui/icons-material/AddCircle';

export const NAVIGATION = [

  { segment: 'new', title: 'Create a memory', icon: <AddCircleIcon /> },
  { segment: '', title: 'Memories', icon: <DashboardIcon /> },
  { segment: 'people', title: 'People', icon: <PeopleIcon /> },
  { segment: 'stats', title: 'Statistics', icon: <BarChartIcon /> },
]; 