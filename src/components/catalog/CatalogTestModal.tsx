import React, { useState } from 'react';
import { FlaskConical, CircleCheck as CheckCircle, Circle as XCircle, Loader, Clock } from 'lucide-react';
import { ConnectorCatalogEntry, ConnectorCatalogTestResult } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { catalogApi } from '@/lib/api';
import { CatalogConnectorIcon } from './CatalogConnectorIcon';

interface CatalogTestModalProps {
  open: boolean;
  onClose: () => void;
  entry: ConnectorCatalogEntry | null;
}

export function CatalogTestModal({ open, onClose, entry }: CatalogTestModalProps) {
  const [endpointUrl, setEndpointUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectorCatalogTestResult | null>(null);

  const handleClose = () => {
    setEndpointUrl('');
    setResult(null);
    onClose();
  };

  const handleTest = async () => {
    if (!entry || !endpointUrl) return;
    setTesting(true);
    setResult(null);
    try {
      const res = await catalogApi.test(entry.id, { endpoint_url: endpointUrl, timeout_seconds: 10 });
      setResult(res.data);
    } catch {
      setResult({ success: false, error: 'Request failed' });
    } finally {
      setTesting(false);
    }
  };

  if (!entry) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Test Connector"
      subtitle={`Verify connectivity for ${entry.name}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Close</Button>
          <Button
            icon={<FlaskConical className="w-4 h-4" />}
            onClick={handleTest}
            loading={testing}
            disabled={!endpointUrl}
          >
            Run Test
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
          <CatalogConnectorIcon icon={entry.icon} color={entry.color || '#2563EB'} size="md" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">{entry.name}</p>
            {entry.vendor && <p className="text-xs text-neutral-400">{entry.vendor}</p>}
          </div>
        </div>

        {!!entry.test_definition?.description && (
          <div className="p-3 rounded-xl bg-primary-50 border border-primary-100">
            <p className="text-xs text-primary-600 font-medium">{String(entry.test_definition.description)}</p>
          </div>
        )}

        <Input
          label="Endpoint URL"
          placeholder="https://your-service.example.com/health"
          value={endpointUrl}
          onChange={(e) => setEndpointUrl(e.target.value)}
          required
          hint="Enter the URL to test connectivity against"
        />

        {testing && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-neutral-100 bg-neutral-50">
            <Loader className="w-5 h-5 animate-spin text-primary-500" />
            <p className="text-sm text-neutral-600">Testing connection...</p>
          </div>
        )}

        {result && !testing && (
          <div
            className={`p-4 rounded-xl border ${
              result.success
                ? 'bg-success-50 border-success-100'
                : 'bg-danger-50 border-danger-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-danger-500" />
              )}
              <span
                className={`text-sm font-semibold ${
                  result.success ? 'text-success-700' : 'text-danger-600'
                }`}
              >
                {result.success ? 'Connection successful' : 'Connection failed'}
              </span>
            </div>
            <div className="space-y-1 ml-7">
              {result.status_code !== undefined && (
                <p className="text-xs text-neutral-600">
                  HTTP {result.status_code}
                </p>
              )}
              {result.response_time_ms !== undefined && (
                <p className="text-xs text-neutral-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {result.response_time_ms.toFixed(0)}ms response time
                </p>
              )}
              {result.error && (
                <p className="text-xs text-danger-500">{result.error}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
