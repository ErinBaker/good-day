import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import ListIcon from '@mui/icons-material/List';
import AddCircleIcon from '@mui/icons-material/AddCircle';

export const NAVIGATION = [
  { segment: '', title: 'Home', icon: <DashboardIcon /> },
  { segment: 'stats', title: 'Statistics', icon: <BarChartIcon /> },
  { segment: 'people', title: 'Person Management', icon: <PeopleIcon /> },
  { segment: 'people/list', title: 'People List', icon: <ListIcon /> },
  { segment: 'create-memory', title: 'Create Memory', icon: <AddCircleIcon /> },
]; 