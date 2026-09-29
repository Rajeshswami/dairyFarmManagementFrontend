import { useState } from 'react';

import {
  Alert,
  Button,
  Card,
  Form,
} from 'react-bootstrap';

import {
  Navigate,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const {
    login,
    isAuthenticated,
  } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await login(
        email,
        password
      );

      navigate('/', {
        replace: true,
      });
    } catch (error) {
      const message =
        error.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card shadow">
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <h3>
              Dairy Farm Management
            </h3>

            <p className="text-muted mb-0">
              Sign in to continue
            </p>
          </div>

          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}

          <Form
            onSubmit={handleSubmit}
          >
            <Form.Group className="mb-3">
              <Form.Label>
                Email
              </Form.Label>

              <Form.Control
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="Enter email"
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>
                Password
              </Form.Label>

              <Form.Control
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter password"
                required
              />
            </Form.Group>

            <Button
              type="submit"
              className="w-100"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : 'Sign In'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}