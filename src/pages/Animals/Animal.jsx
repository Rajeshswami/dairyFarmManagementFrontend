import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  InputGroup,
  Spinner,
  Table,
} from 'react-bootstrap';

import { useAuth } from '../../context/AuthContext';

import {
  createAnimalApi,
  getAnimalsApi,
  updateAnimalApi,
  updateAnimalStatusApi,
} from '../../api/animals.api';

import AnimalForm from './AnimalForm';
import './animal-phase9.css';

export default function Animals() {
  const { user } = useAuth();

  const [animals, setAnimals] = useState([]);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canManage =
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER';

  const loadAnimals = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getAnimalsApi();

      if (Array.isArray(result)) {
        setAnimals(result);
      } else if (Array.isArray(result?.animals)) {
        setAnimals(result.animals);
      } else {
        setAnimals([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          'Failed to load animals.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnimals();
  }, []);

  const filteredAnimals = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return animals;
    }

    return animals.filter((animal) => {
      return (
        animal.tagNumber?.toLowerCase().includes(value) ||
        animal.name?.toLowerCase().includes(value) ||
        animal.breed?.toLowerCase().includes(value) ||
        animal.gender?.toLowerCase().includes(value) ||
        animal.status?.toLowerCase().includes(value)
      );
    });
  }, [animals, search]);

  const handleAdd = () => {
    setSelectedAnimal(null);
    setShowForm(true);
  };

  const handleEdit = (animal) => {
    setSelectedAnimal(animal);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    try {
      setSaving(true);
      setError('');

      if (selectedAnimal) {
        await updateAnimalApi(selectedAnimal._id, data);
      } else {
        await createAnimalApi(data);
      }

      setShowForm(false);
      setSelectedAnimal(null);

      await loadAnimals();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          'Failed to save animal.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (animal, status) => {
    const action =
      status === 'ACTIVE'
        ? 'activate'
        : status === 'SOLD'
          ? 'mark as sold'
          : 'mark as dead';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${animal.tagNumber}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      await updateAnimalStatusApi(
        animal._id,
        status
      );

      await loadAnimals();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          'Failed to update animal status.'
      );
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';

      case 'SOLD':
        return 'secondary';

      case 'DEAD':
        return 'danger';

      default:
        return 'dark';
    }
  };

  return (
    <div className="animal-phase9">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">पशु प्रबंधन <span className="animal-en-title">/ Animals</span></h2>
          <p className="text-muted mb-0">
            अपने पशुओं का रिकॉर्ड और स्थिति आसानी से संभालें। / Manage animals and their status.
          </p>
        </div>

        {canManage && (
          <Button className="animal-add-btn" onClick={handleAdd}>
            ＋ पशु जोड़ें / Add Animal
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError('')}
        >
          {Array.isArray(error)
            ? error.join(', ')
            : error}
        </Alert>
      )}

      {/* Search */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <InputGroup>
            <InputGroup.Text>
              🔍
            </InputGroup.Text>

            <Form.Control
              placeholder="टैग, नाम, नस्ल या स्थिति खोजें / Search animals..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {/* Statistics */}
      <div className="row g-3 mb-4">

        <div className="col-md-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">
                कुल पशु / Total Animals
              </div>

              <div className="fs-3 fw-bold">
                {animals.length}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">
                सक्रिय पशु / Active Animals
              </div>

              <div className="fs-3 fw-bold text-success">
                {
                  animals.filter(
                    (animal) =>
                      animal.status === 'ACTIVE'
                  ).length
                }
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">
                निष्क्रिय पशु / Inactive Animals
              </div>

              <div className="fs-3 fw-bold">
                {
                  animals.filter(
                    (animal) =>
                      animal.status !== 'ACTIVE'
                  ).length
                }
              </div>
            </Card.Body>
          </Card>
        </div>

      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <div className="text-muted mt-2">
                पशुओं का रिकॉर्ड लोड हो रहा है… / Loading animals...
              </div>
            </div>
          ) : filteredAnimals.length === 0 ? (
            <div className="text-center py-5 text-muted">
              {search
                ? 'कोई पशु नहीं मिला / No animals found.'
                : 'अभी कोई पशु दर्ज नहीं है / No animals available.'}
            </div>
          ) : (
            <div className="table-responsive">

              <Table
                hover
                responsive
                className="mb-0 align-middle"
              >
                <thead className="table-light">
                  <tr>
                    <th>टैग / Tag</th>
                    <th>नाम / Name</th>
                    <th>नस्ल / Breed</th>
                    <th>लिंग / Gender</th>
                    <th>जन्म तारीख / DOB</th>
                    <th>खरीद मूल्य / Price</th>
                    <th>स्थिति / Status</th>

                    {canManage && (
                      <th className="text-end">
                        कार्य / Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredAnimals.map((animal) => (
                    <tr key={animal._id}>

                      <td>
                        <strong>
                          {animal.tagNumber}
                        </strong>
                      </td>

                      <td>
                        {animal.name || '-'}
                      </td>

                      <td>
                        {animal.breed || '-'}
                      </td>

                      <td>
                        {animal.gender || '-'}
                      </td>

                      <td>
                        {animal.dateOfBirth
                          ? new Date(
                              animal.dateOfBirth
                            ).toLocaleDateString(
                              'en-IN'
                            )
                          : '-'}
                      </td>

                      <td>
                        {animal.purchasePrice !==
                        undefined
                          ? `₹${Number(
                              animal.purchasePrice
                            ).toLocaleString('en-IN')}`
                          : '-'}
                      </td>

                      <td>
                        <Badge
                          bg={getStatusVariant(
                            animal.status
                          )}
                        >
                          {animal.status}
                        </Badge>
                      </td>

                      {canManage && (
                        <td>
                          <div className="d-flex justify-content-end gap-2">

                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() =>
                                handleEdit(animal)
                              }
                            >
                              Edit
                            </Button>

                            {animal.status !==
                              'ACTIVE' && (
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() =>
                                  handleStatusChange(
                                    animal,
                                    'ACTIVE'
                                  )
                                }
                              >
                                Activate
                              </Button>
                            )}

                            {animal.status ===
                              'ACTIVE' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() =>
                                    handleStatusChange(
                                      animal,
                                      'SOLD'
                                    )
                                  }
                                >
                                  Sold
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() =>
                                    handleStatusChange(
                                      animal,
                                      'DEAD'
                                    )
                                  }
                                >
                                  Dead
                                </Button>
                              </>
                            )}

                          </div>
                        </td>
                      )}

                    </tr>
                  ))}
                </tbody>
              </Table>

            </div>
          )}

        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <AnimalForm
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setSelectedAnimal(null);
        }}
        onSubmit={handleSubmit}
        animal={selectedAnimal}
        loading={saving}
      />

    </div>
  );
}