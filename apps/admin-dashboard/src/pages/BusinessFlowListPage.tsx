import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, Badge, Button, Modal, Alert } from '@/components';
import { Plus, Pencil, Trash2, Power, PowerOff, ArrowLeft } from 'lucide-react';
import { adminFlowsApi } from '@/api/adminFlows';
import type { FlowSummary } from '@/api/flows';

/**
 * Business-scoped flow list page.
 * Reads businessId from route params and uses admin API endpoints.
 */
export const BusinessFlowListPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; isActive: boolean } | null>(null);

  const fetchFlows = async () => {
    if (!businessId) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await adminFlowsApi.listFlows(businessId);
      setFlows(result);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load flows');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, [businessId]);

  if (!businessId) {
    return <Navigate to="/flows" replace />;
  }

  const handlePublish = async (id: string) => {
    setIsSaving(true);
    try {
      await adminFlowsApi.publishFlow(businessId, id);
      await fetchFlows();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to publish flow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    setIsSaving(true);
    try {
      await adminFlowsApi.archiveFlow(businessId, id);
      await fetchFlows();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to archive flow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await adminFlowsApi.deleteFlow(businessId, deleteTarget.id);
      setDeleteTarget(null);
      await fetchFlows();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete flow');
      setDeleteTarget(null);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-5">
      {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/flows')}
            className="p-1.5 rounded-salex-md hover:bg-[#F5F3F1] transition-colors"
          >
            <ArrowLeft size={16} style={{ color: '#6F6D7A' }} />
          </button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: '#A8A6B0' }}>Flows</p>
            <h1 className="font-serif text-[28px] leading-tight" style={{ color: '#03031F', fontWeight: 400 }}>Conversation Flows</h1>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate(`/businesses/${businessId}/flows/new`)}
          leftIcon={<Plus size={15} />}
        >
          Create New Flow
        </Button>
      </div>

      {/* Flow List */}
      <Card>
        <CardHeader
          title="Flow Versions"
          subtitle="Manage conversation flows for this business"
        />
        <CardBody>
          {isLoading && flows.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" style={{ width: 24, height: 24 }} />
            </div>
          ) : flows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[14px]" style={{ color: '#6F6D7A' }}>
                No flows yet. Create your first conversation flow to get started.
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => navigate(`/businesses/${businessId}/flows/new`)}
                leftIcon={<Plus size={15} />}
              >
                Create New Flow
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {flows.map((flow) => (
                <div
                  key={flow.id}
                  className="flex items-center justify-between p-4 rounded-salex-md border transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#E5E4E3' }}
                >
                  {/* Flow info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-salex-sm truncate" style={{ color: '#03031F' }}>
                        {flow.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-mono text-[11px]" style={{ color: '#A8A6B0' }}>
                          v{flow.version}
                        </span>
                        <span className="font-mono text-[11px]" style={{ color: '#A8A6B0' }}>
                          Updated {formatDate(flow.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge
                      variant={flow.isActive ? 'success' : 'muted'}
                      label={flow.isActive ? 'Published' : 'Draft'}
                      dot
                    />

                    {/* Publish / Archive toggle */}
                    {flow.isActive ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleArchive(flow.id)}
                        disabled={isSaving}
                        title="Archive flow"
                      >
                        <PowerOff size={14} />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePublish(flow.id)}
                        disabled={isSaving}
                        title="Publish flow"
                      >
                        <Power size={14} />
                      </Button>
                    )}

                    {/* Edit */}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/businesses/${businessId}/flows/${flow.id}/edit`)}
                      title="Edit flow"
                    >
                      <Pencil size={14} />
                    </Button>

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteTarget({ id: flow.id, name: flow.name, isActive: flow.isActive })}
                      disabled={flow.isActive}
                      title={flow.isActive ? 'Archive before deleting' : 'Delete flow'}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Flow"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              isLoading={isSaving}
              disabled={deleteTarget?.isActive}
            >
              Delete
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3">
            {deleteTarget.isActive ? (
              <Alert
                type="warning"
                title="Cannot delete published flow"
                message="You must archive this flow before it can be deleted."
              />
            ) : (
              <p className="text-[13px]" style={{ color: '#2E2D38' }}>
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
