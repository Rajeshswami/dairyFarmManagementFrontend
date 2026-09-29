import { useEffect, useState } from 'react';
import { Button, Form, Modal, Row, Col } from 'react-bootstrap';

const initialForm = {
  tagNumber: '',
  name: '',
  breed: '',
  gender: 'FEMALE',
  dateOfBirth: '',
  purchaseDate: '',
  purchasePrice: '',
  notes: '',
};

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

export default function AnimalForm({
  show,
  onHide,
  onSubmit,
  animal,
  loading = false,
}) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (animal) {
      setForm({
        tagNumber: animal.tagNumber || '',
        name: animal.name || '',
        breed: animal.breed || '',
        gender: animal.gender || 'FEMALE',
        dateOfBirth: formatDate(animal.dateOfBirth),
        purchaseDate: formatDate(animal.purchaseDate),
        purchasePrice:
          animal.purchasePrice !== undefined &&
          animal.purchasePrice !== null
            ? animal.purchasePrice
            : '',
        notes: animal.notes || '',
      });
    } else {
      setForm(initialForm);
    }
  }, [animal, show]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      tagNumber: form.tagNumber.trim(),
      name: form.name.trim(),
      breed: form.breed.trim(),
      gender: form.gender,
      dateOfBirth: form.dateOfBirth || undefined,
      purchaseDate: form.purchaseDate || undefined,
      purchasePrice:
        form.purchasePrice === ''
          ? undefined
          : Number(form.purchasePrice),
      notes: form.notes.trim() || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {animal ? 'Edit Animal' : 'Add Animal'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="g-3">

            <Col md={6}>
              <Form.Group>
                <Form.Label>Tag Number *</Form.Label>
                <Form.Control
                  name="tagNumber"
                  value={form.tagNumber}
                  onChange={handleChange}
                  placeholder="e.g. COW-001"
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Ganga"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Breed</Form.Label>
                <Form.Control
                  name="breed"
                  value={form.breed}
                  onChange={handleChange}
                  placeholder="e.g. Gir"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Gender *</Form.Label>
                <Form.Select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Purchase Date</Form.Label>
                <Form.Control
                  type="date"
                  name="purchaseDate"
                  value={form.purchaseDate}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Purchase Price (₹)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  name="purchasePrice"
                  value={form.purchasePrice}
                  onChange={handleChange}
                  placeholder="0"
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional information..."
                />
              </Form.Group>
            </Col>

          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={onHide}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Saving...'
              : animal
                ? 'Update Animal'
                : 'Add Animal'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}