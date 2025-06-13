import React, { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const GET_ALL_PEOPLE = gql`
  query GetAllPeople($search: String) {
    people(search: $search) {
      id
      name
      relationship
    }
  }
`;

const CREATE_PERSON = gql`
  mutation CreatePerson($name: String!, $relationship: String) {
    createPerson(input: { name: $name, relationship: $relationship }) {
      id
      name
      relationship
    }
  }
`;

export type Person = {
  id: string;
  name: string;
  relationship?: string;
};

type PersonSelectionProps = {
  value: Person[];
  onChange: (people: Person[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

const filter = createFilterOptions<Person | { inputValue: string; name: string }>();

const PersonSelection: React.FC<PersonSelectionProps> = ({
  value,
  onChange,
  label = "Tag People",
  placeholder = "Search or add a person...",
  disabled = false,
}) => {
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonRelationship, setNewPersonRelationship] = useState("");

  const { data, loading, error, refetch } = useQuery(GET_ALL_PEOPLE, {
    variables: { search },
  });

  const [createPerson, { loading: creating }] = useMutation(CREATE_PERSON);

  const handleInputChange = (_event: React.SyntheticEvent, value: string) => {
    setSearch(value);
  };

  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: (Person | { inputValue: string; name: string })[]
  ) => {
    const last = newValue[newValue.length - 1];
    if (last && "inputValue" in last) {
      setNewPersonName(last.inputValue);
      setOpenDialog(true);
    } else {
      onChange(newValue.filter((v): v is Person => !("inputValue" in v)));
    }
  };

  const handleAddPerson = async () => {
    if (!newPersonName.trim()) return;
    try {
      const { data: mutationData } = await createPerson({
        variables: { name: newPersonName, relationship: newPersonRelationship || undefined },
      });
      if (mutationData?.createPerson) {
        onChange([...value, mutationData.createPerson]);
        refetch();
      }
      setOpenDialog(false);
      setNewPersonName("");
      setNewPersonRelationship("");
    } catch {
      // Optionally handle error
    }
  };

  return (
    <>
      <Autocomplete
        multiple
        disabled={disabled}
        options={data?.people || []}
        value={value as (Person | { inputValue: string; name: string })[]}
        onChange={handleChange}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);
          if (params.inputValue !== "") {
            filtered.push({
              inputValue: params.inputValue,
              name: `Add "${params.inputValue}"`,
            });
          } else {
            filtered.push({
              inputValue: "",
              name: "Add a person",
            });
          }
          return filtered;
        }}
        getOptionLabel={option => {
          if (typeof option === "string") return option;
          if ("inputValue" in option) return option.inputValue;
          return option.name;
        }}
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest}>
              {"inputValue" in option ? (
                <em>{option.name}</em>
              ) : (
                <>
                  {option.name}
                  {option.relationship ? ` (${option.relationship})` : ""}
                </>
              )}
            </li>
          );
        }}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            disabled={disabled}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            error={!!error}
            helperText={error ? "Failed to load people" : ""}
            onChange={e => handleInputChange(e, e.target.value)}
          />
        )}
        renderTags={(selected, getTagProps) =>
          selected.map((option, index) => {
            const rest = Object.fromEntries(
              Object.entries(getTagProps({ index })).filter(([k]) => k !== 'key')
            );
            return (
              <Chip
                key={
                  'id' in option
                    ? option.id
                    : 'inputValue' in option
                    ? option.inputValue
                    : index
                }
                label={
                  'name' in option
                    ? option.name
                    : typeof option === 'string'
                    ? option
                    : ''
                }
                {...rest}
              />
            );
          })
        }
        isOptionEqualToValue={(option, value) => {
          if ("inputValue" in option || "inputValue" in value) {
            return (
              "inputValue" in option &&
              "inputValue" in value &&
              option.inputValue === value.inputValue
            );
          }
          return (option as Person).id === (value as Person).id;
        }}
        onInputChange={handleInputChange}
        loading={loading}
        noOptionsText={loading ? "Loading..." : "No people found"}
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} aria-labelledby="add-person-dialog-title">
        <DialogTitle id="add-person-dialog-title">Add New Person</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newPersonName}
            onChange={e => setNewPersonName(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Relationship (optional)"
            fullWidth
            value={newPersonRelationship}
            onChange={e => setNewPersonRelationship(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPerson}
            disabled={creating || !newPersonName.trim()}
            variant="contained"
          >
            {creating ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PersonSelection; 