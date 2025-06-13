import React from 'react';
import { Paper, Typography, Stack, ToggleButtonGroup, ToggleButton, List, ListItem, ListItemAvatar, ListItemText, Checkbox, ListItemButton, Autocomplete, TextField, Chip, Avatar, useMediaQuery } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import { useTheme } from '@mui/material/styles';
import dayjs, { Dayjs } from 'dayjs';
import { AvatarGenerator } from 'random-avatar-generator';
import Box from '@mui/material/Box';

const avatarGenerator = new AvatarGenerator();

type Person = {
  id: string;
  name: string;
  relationship?: string;
};

type ShortcutOption = { label: string; getValue: () => [Dayjs | null, Dayjs | null] };

type Props = {
  dateRange: [Dayjs | null, Dayjs | null];
  setDateRange: (range: [Dayjs | null, Dayjs | null]) => void;
  shortcutOptions: ShortcutOption[];
  activeShortcut: number | null;
  handleShortcut: (idx: number) => void;
  peopleData: { people: Person[] } | undefined;
  peopleLoading: boolean;
  peopleError: unknown;
  selectedPeople: Person[];
  setSelectedPeople: (people: Person[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAllMemories: (memories: any[]) => void;
  setOffset: (offset: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setInitialLoad: (init: boolean) => void;
};

const MemoryTimelineFilters: React.FC<Props> = ({
  dateRange,
  setDateRange,
  shortcutOptions,
  activeShortcut,
  handleShortcut,
  peopleData,
  peopleLoading,
  peopleError,
  selectedPeople,
  setSelectedPeople,
  setAllMemories,
  setOffset,
  setHasMore,
  setInitialLoad,
}) => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 320 },
        flexShrink: 0,
        position: { md: 'sticky' },
        top: { md: 32 },
        alignSelf: { md: 'flex-start' },
        zIndex: 1,
      }}
    >
      <Paper elevation={3} sx={{ p: 3, mb: { xs: 2, md: 0 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filters
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={2}>
            <ToggleButtonGroup
              value={activeShortcut}
              exclusive
              onChange={(_e, newIndex) => {
                if (newIndex !== null) handleShortcut(newIndex);
              }}
              size="small"
              sx={{ flexWrap: 'wrap', mb: 1 }}
            >
              {shortcutOptions.map((shortcut, idx) => (
                <ToggleButton
                  key={shortcut.label}
                  value={idx}
                  sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
                >
                  {shortcut.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <DatePicker
              label="Start Date"
              value={dateRange[0] && dayjs.isDayjs(dateRange[0]) ? dateRange[0] : null}
              onChange={(newValue) => {
                setDateRange([newValue, dateRange[1]]);
              }}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              maxDate={dateRange[1] || undefined}
            />
            <DatePicker
              label="End Date"
              value={dateRange[1] && dayjs.isDayjs(dateRange[1]) ? dateRange[1] : null}
              onChange={(newValue) => {
                setDateRange([dateRange[0], newValue]);
              }}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              minDate={dateRange[0] || undefined}
            />
            {/* People Filter */}
            {isLargeScreen ? (
              <List dense sx={{ maxHeight: 320, overflowY: 'auto', bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 0 }}>
                {peopleData?.people?.map((person) => {
                  const checked = selectedPeople.some((p) => p.id === person.id);
                  const avatarUrl = person.name ? avatarGenerator.generateRandomAvatar(person.name) : undefined;
                  return (
                    <ListItem key={person.id} disablePadding secondaryAction={null}>
                      <ListItemButton
                        role={undefined}
                        onClick={() => {
                          let newSelected;
                          if (checked) {
                            newSelected = selectedPeople.filter((p) => p.id !== person.id);
                          } else {
                            newSelected = [...selectedPeople, person];
                          }
                          setSelectedPeople(newSelected);
                          setAllMemories([]);
                          setOffset(0);
                          setHasMore(true);
                          setInitialLoad(true);
                        }}
                        dense
                        selected={checked}
                        sx={{ borderRadius: 0, pl: 1, pr: 1 }}
                      >
                        <ListItemAvatar>
                          <Avatar src={avatarUrl} alt={`Avatar for ${person.name}`} sx={{ width: 32, height: 32 }} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={person.name}
                          secondary={person.relationship}
                          primaryTypographyProps={{ fontWeight: checked ? 600 : 400 }}
                        />
                        <Checkbox
                          edge="end"
                          checked={checked}
                          tabIndex={-1}
                          disableRipple
                          inputProps={{ 'aria-labelledby': `person-checkbox-${person.id}` }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Autocomplete
                multiple
                options={peopleData?.people || []}
                value={selectedPeople}
                onChange={(_e, newValue) => {
                  setSelectedPeople(newValue as Person[]);
                  setAllMemories([]); // Reset timeline when filter changes
                  setOffset(0);
                  setHasMore(true);
                  setInitialLoad(true);
                }}
                getOptionLabel={option => option.name + (option.relationship ? ` (${option.relationship})` : '')}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={peopleLoading}
                disabled={peopleLoading || !!peopleError}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Filter by People"
                    placeholder="Select people..."
                    error={!!peopleError}
                    helperText={peopleError ? 'Failed to load people' : ''}
                    fullWidth
                  />
                )}
                renderTags={(selected, getTagProps) =>
                  selected.map((option, index) => {
                    const restTagProps = Object.fromEntries(Object.entries(getTagProps({ index })).filter(([k]) => k !== 'key'));
                    const avatarUrl = 'name' in option ? avatarGenerator.generateRandomAvatar(option.name) : undefined;
                    return (
                      <Chip
                        key={option.id}
                        avatar={avatarUrl ? (
                          <Avatar src={avatarUrl} alt={`Avatar for ${option.name}`} sx={{ width: 32, height: 32 }} />
                        ) : undefined}
                        label={option.name + (option.relationship ? ` (${option.relationship})` : '')}
                        {...restTagProps}
                      />
                    );
                  })
                }
                renderOption={(props, option) => {
                  const avatarUrl = 'name' in option ? avatarGenerator.generateRandomAvatar(option.name) : undefined;
                  return (
                    <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={avatarUrl}
                        alt={`Avatar for ${option.name}`}
                        sx={{ width: 28, height: 28, marginRight: 1 }}
                      />
                      <span>{option.name}{option.relationship ? ` (${option.relationship})` : ''}</span>
                    </li>
                  );
                }}
              />
            )}
          </Stack>
        </LocalizationProvider>
      </Paper>
    </Box>
  );
};

export default MemoryTimelineFilters; 