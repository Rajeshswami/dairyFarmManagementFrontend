import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Col,
  Form,
  Modal,
  Row,
} from 'react-bootstrap';

const initialForm = {
  animalId: '',
  date: '',
  morning: '',
  evening: '',
  note: '',
};

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

export default function MilkProductionForm({
  show,
  onHide,
  onSubmit,
  production,
  animals,
  loading = false,
}) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (production) {
      setForm({
        animalId:
          production.animalId?._id ||
          production.animalId ||
          '',
        date: formatDate(production.date),
        morning:
          production.morning !== undefined
            ? production.morning
            : '',
        evening:
          production.evening !== undefined
            ? production.evening
            : '',
        note: production.note || '',
      });
    } else {
      setForm(initialForm);
    }
  }, [production, show]);

  const totalLiters = useMemo(() => {
    const morning =
      form.morning === ''
        ? 0
        : Number(form.morning);

    const evening =
      form.evening === ''
        ? 0
        : Number(form.evening);

    return morning + evening;
  }, [form.morning, form.evening]);

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
      animalId: form.animalId,
      date: form.date,
      morning:
        form.morning === ''
          ? 0
          : Number(form.morning),
      evening:
        form.evening === ''
          ? 0
          : Number(form.evening),
      note: form.note.trim() || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
    >
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {production
              ? 'दूध उत्पादन बदलें / Edit Production'
              : 'दूध दर्ज करें / Add Production'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="g-3">

            {/* पशु चुनें / Animal */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  पशु चुनें / Animal *
                </Form.Label>

                <Form.Select
                  name="animalId"
                  value={form.animalId}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    पशु चुनें / Select animal
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
            </Col>

            {/* Date */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  तारीख / Production Date *
                </Form.Label>

                <Form.Control
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>

            {/* Morning */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  सुबह का दूध / Morning Milk (Liters)
                </Form.Label>

                <Form.Control
                  type="number"
                  name="morning"
                  value={form.morning}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  placeholder="0"
                />
              </Form.Group>
            </Col>

            {/* Evening */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  शाम का दूध / Evening Milk (Liters)
                </Form.Label>

                <Form.Control
                  type="number"
                  name="evening"
                  value={form.evening}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  placeholder="0"
                />
              </Form.Group>
            </Col>

            {/* Total */}
            <Col md={12}>
              <div className="p-3 bg-light rounded">
                <div className="text-muted small">
                  कुल दूध / Total Production
                </div>

                <div className="fs-3 fw-bold">
                  {totalLiters.toFixed(2)} L
                </div>
              </div>
            </Col>

            {/* Note */}
            <Col md={12}>
              <Form.Group>
                <Form.Label>
                  Note
                </Form.Label>

                <Form.Control
                  as="textarea"
                  rows={3}
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="वैकल्पिक नोट / Optional note..."
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
              : production
                ? 'Update Production'
                : 'दूध सेव करें / Save Production'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}