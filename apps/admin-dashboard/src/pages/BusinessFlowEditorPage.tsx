import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { FlowEditorPage } from './FlowEditorPage';

/**
 * Business-scoped wrapper for FlowEditorPage.
 * Reads businessId from route params and redirects to /businesses if missing.
 * The FlowEditorPage will be updated in task 13.3 to consume businessId from params.
 */
export const BusinessFlowEditorPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();

  if (!businessId) {
    return <Navigate to="/businesses" replace />;
  }

  return <FlowEditorPage />;
};
