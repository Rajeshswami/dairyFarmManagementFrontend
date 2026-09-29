import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Spinner,
  Table,
} from 'react-bootstrap';

import { useAuth } from '../../context/AuthContext';

import {
  getActiveAnimalsApi,
} from '../../api/animals.api';

import {
  createMilkProductionApi,
  deleteMilkProductionApi,
  getMilkProductionApi,
  updateMilkProductionApi,
} from '../../api/milkProduction.api';

import MilkProductionForm from './MilkProductionForm';

export default function MilkProduction() {
  const { user } = useAuth();

  const [animals, setAnimals] = useState([]);
  const [production, setProduction] = useState([]);

  const [selectedAnimal, setSelectedAnimal] =
    useState('');

  const [selectedDate, setSelectedDate] =
    useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const [showForm, setShowForm] =
    useState(false);

  const [selectedProduction, setSelectedProduction] =
    useState(null);

  const canManage =
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER';

  /*
   * Load active animals
   */
  const loadAnimals = async () => {
    try {
      const result =
        await getActiveAnimalsApi();

      if (Array.isArray(result)) {
        setAnimals(result);
      } else if (
        Array.isArray(result?.animals)
      ) {
        setAnimals(result.animals);
      } else {
        setAnimals([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          'Failed to load animals.',
      );
    }
  };

  /*
   * Load production
   */
  const loadProduction = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};

      if (selectedAnimal) {
        params.animalId =
          selectedAnimal;
      }

      if (selectedDate) {
        params.date =
          selectedDate;
      }

      const result =
        await getMilkProductionApi(params);

      if (Array.isArray(result)) {
        setProduction(result);
      } else if (
        Array.isArray(result?.production)
      ) {
        setProduction(result.production);
      } else if (
        Array.isArray(result?.data)
      ) {
        setProduction(result.data);
      } else {
        setProduction([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          'Failed to load milk production.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnimals();
  }, []);

  useEffect(() => {
    loadProduction();
  }, [selectedAnimal, selectedDate]);

  /*
   * Summary
   */
  const summary = useMemo(() => {
    return production.reduce(
      (result, item) => {
        result.morning +=
          Number(item.morning) || 0;

        result.evening +=
          Number(item.evening) || 0;

        result.total +=
          Number(item.totalLiters) || 0;

        return result;
      },
      {
        morning: 0,
        evening: 0,
        total: 0,
      },
    );
  }, [production]);

  /*
   * Add
   */
  const handleAdd = () => {
    setSelectedProduction(null);
    setShowForm(true);
  };

  /*
   * Edit
   */
  const handleEdit = (item) => {
    setSelectedProduction(item);
    setShowForm(true);
  };

  /*
   * Save
   */
  const handleSubmit = async (data) => {
    try {
      setSaving(true);
      setError('');

      if (selectedProduction) {
        await updateMilkProductionApi(
          selectedProduction._id,
          data,
        );
      } else {
        await createMilkProductionApi(data);
      }

      setShowForm(false);
      setSelectedProduction(null);

      await loadProduction();
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message ||
            'Failed to save milk production.',
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Delete
   */
  const handleDelete = async (item) => {
    const animal =
      item.animalId?.tagNumber ||
      item.animalId?.name ||
      'this animal';

    const confirmed =
      window.confirm(
        `Delete milk production for ${animal} on ${formatDate(
          item.date,
        )}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      await deleteMilkProductionApi(
        item._id,
      );

      await loadProduction();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          'Failed to delete production.',
      );
    }
  };

  /*
   * Clear filters
   */
  const clearFilters = () => {
    setSelectedAnimal('');
    setSelectedDate('');
  };

  return (
    <div>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            Milk Production
          </h2>

          <p className="text-muted mb-0">
            Track daily milk production for
            each animal.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            onClick={handleAdd}
          >
            + Add Production
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

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="row g-3 align-items-end">

            <div className="col-md-5">
              <Form.Group>
                <Form.Label>
                  Animal
                </Form.Label>

                <Form.Select
                  value={selectedAnimal}
                  onChange={(event) =>
                    setSelectedAnimal(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    All Animals
                  </option>

                  {animals.map((animal) => (
                    <option
                      key={animal._id}
                      value={animal._id}
                    >
                      {animal.tagNumber}
                      {animal.name
                        ? ` - ${animal.name}`
                        : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-4">
              <Form.Group>
                <Form.Label>
                  Date
                </Form.Label>

                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(event) =>
                    setSelectedDate(
                      event.target.value,
                    )
                  }
                />
              </Form.Group>
            </div>

            <div className="col-md-3">
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>

          </div>
        </Card.Body>
      </Card>

      {/* Summary */}
      <div className="row g-3 mb-4">

        <div className="col-md-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">
                Morning Production
              </div>

              <div className="fs-3 fw-bold">
                {summary.morning.toFixed(2)} L
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">
                Evening Production
              </div>

              <div className="fs-3 fw-bold">
                {summary.evening.toFixed(2)} L
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">
                Total Production
              </div>

              <div className="fs-3 fw-bold text-success">
                {summary.total.toFixed(2)} L
              </div>
            </Card.Body>
          </Card>
        </div>

      </div>

      {/* Production Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />

              <div className="text-muted mt-2">
                Loading production...
              </div>
            </div>
          ) : production.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No milk production records found.
            </div>
          ) : (
            <div className="table-responsive">

              <Table
                hover
                className="mb-0 align-middle"
              >
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Animal</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Total</th>
                    <th>Note</th>

                    {canManage && (
                      <th className="text-end">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {production.map((item) => {

                    const animal =
                      item.animalId;

                    const animalName =
                      animal?.tagNumber ||
                      animal?.name ||
                      'Unknown';

                    return (
                      <tr key={item._id}>

                        <td>
                          {formatDate(
                            item.date,
                          )}
                        </td>

                        <td>
                          <strong>
                            {animalName}
                          </strong>

                          {animal?.name &&
                            animal?.tagNumber && (
                              <div className="text-muted small">
                                {animal.name}
                              </div>
                            )}
                        </td>

                        <td>
                          {Number(
                            item.morning || 0,
                          ).toFixed(2)}{' '}
                          L
                        </td>

                        <td>
                          {Number(
                            item.evening || 0,
                          ).toFixed(2)}{' '}
                          L
                        </td>

                        <td>
                          <Badge bg="success">
                            {Number(
                              item.totalLiters ||
                                0,
                            ).toFixed(2)}{' '}
                            L
                          </Badge>
                        </td>

                        <td>
                          {item.note || '-'}
                        </td>

                        {canManage && (
                          <td>
                            <div className="d-flex justify-content-end gap-2">

                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() =>
                                  handleEdit(
                                    item,
                                  )
                                }
                              >
                                Edit
                              </Button>

                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() =>
                                  handleDelete(
                                    item,
                                  )
                                }
                              >
                                Delete
                              </Button>

                            </div>
                          </td>
                        )}

                      </tr>
                    );
                  })}
                </tbody>
              </Table>

            </div>
          )}

        </Card.Body>
      </Card>

      {/* Form */}
      <MilkProductionForm
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setSelectedProduction(null);
        }}
        onSubmit={handleSubmit}
        production={selectedProduction}
        animals={animals}
        loading={saving}
      />

    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('en-IN');
}