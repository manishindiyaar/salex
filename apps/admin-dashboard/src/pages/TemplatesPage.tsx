import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Table, Badge, Button, Modal, Alert } from '@/components';
import { apiClient } from '@/services/apiClient';

interface Template {
  id: string;
  code: string;
  displayName: string;
  icon: string;
  businessCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  enabledModules: string[];
  terminology: {
    resource: string;
    staff: string;
    service: string;
    appointment: string;
    customer: string;
  };
}

interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  totalBusinesses: number;
  mostUsedTemplate: string;
}

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
    calculateStats();
  }, [templates, searchTerm, moduleFilter]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.listTemplates();
      const templatesData = response.data.templates || [];
      setTemplates(templatesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    if (templates.length === 0) return;
    
    const activeTemplates = templates.filter(t => t.isActive);
    const totalBusinesses = templates.reduce((sum, t) => sum + (t.businessCount || 0), 0);
    const mostUsed = templates.reduce((prev, current) => 
      (prev.businessCount > current.businessCount) ? prev : current
    );

    setStats({
      totalTemplates: templates.length,
      activeTemplates: activeTemplates.length,
      totalBusinesses,
      mostUsedTemplate: mostUsed.displayName
    });
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (moduleFilter) {
      filtered = filtered.filter(template => 
        template.enabledModules.includes(moduleFilter)
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleViewDetails = (template: Template) => {
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  const handleDeleteTemplate = async (code: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await apiClient.deleteTemplate(code);
      fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete template');
    }
  };

  const getUniqueModules = () => {
    const modules = new Set<string>();
    templates.forEach(template => {
      template.enabledModules.forEach(module => modules.add(module));
    });
    return Array.from(modules);
  };

  const columns = [
    {
      key: 'displayName',
      label: 'Template Name',
      render: (value: string, row: Template) => (
        <div>
          <p className="font-salex-medium">{row.icon} {value}</p>
          <p className="text-salex-xs text-salex-secondary">Code: {row.code}</p>
        </div>
      ),
    },
    {
      key: 'enabledModules',
      label: 'Modules',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 3).map((module, index) => (
            <Badge key={index} label={module} variant="info" size="sm" />
          ))}
          {value.length > 3 && (
            <Badge label={`+${value.length - 3}`} variant="default" size="sm" />
          )}
        </div>
      ),
    },
    {
      key: 'businessCount',
      label: 'Usage',
      render: (value: number) => (
        <div>
          <p className="text-salex-sm font-salex-medium">{value}</p>
          <p className="text-salex-xs text-salex-secondary">businesses</p>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => (
        <Badge 
          label={value ? 'Active' : 'Inactive'} 
          variant={value ? 'success' : 'default'} 
          size="sm" 
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value: string) => (
        <p className="text-salex-sm text-salex-secondary">
          {new Date(value).toLocaleDateString()}
        </p>
      ),
    },
    {
      key: 'code',
      label: 'Actions',
      render: (value: string, row: Template) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleViewDetails(row)}
          >
            👁️
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteTemplate(value)}
          >
            🗑️
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-salex-lg">
      {error && <Alert type="error" title="Error" message={error} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-salex-2xl font-salex-bold text-salex-white">Niche Templates</h1>
        <div className="text-salex-sm text-salex-secondary">
          Manage business category templates and configurations
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-salex-lg">
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-salex-2xl font-salex-bold text-salex-white">{stats.totalTemplates}</p>
                <p className="text-salex-sm text-salex-secondary">Total Templates</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-salex-2xl font-salex-bold text-salex-green">{stats.activeTemplates}</p>
                <p className="text-salex-sm text-salex-secondary">Active Templates</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-salex-2xl font-salex-bold text-salex-blue">{stats.totalBusinesses}</p>
                <p className="text-salex-sm text-salex-secondary">Total Businesses</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-salex-lg font-salex-medium text-salex-white">{stats.mostUsedTemplate}</p>
                <p className="text-salex-sm text-salex-secondary">Most Popular</p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-salex-md">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-salex-black-light border border-salex-gray-border rounded-salex-md px-salex-md py-salex-sm text-salex-white"
              />
            </div>
            <div className="md:w-48">
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full bg-salex-black-light border border-salex-gray-border rounded-salex-md px-salex-md py-salex-sm text-salex-white"
              >
                <option value="">All Modules</option>
                {getUniqueModules().map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader 
          title="Templates" 
          subtitle={`Showing ${filteredTemplates.length} of ${templates.length} templates`} 
        />
        <CardBody>
          <Table columns={columns} data={filteredTemplates} isLoading={isLoading} />
        </CardBody>
      </Card>

      {/* Template Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTemplate(null);
        }}
        title={selectedTemplate ? `${selectedTemplate.icon} ${selectedTemplate.displayName}` : 'Template Details'}
      >
        {selectedTemplate && (
          <div className="space-y-salex-lg">
            <div>
              <h3 className="text-salex-lg font-salex-medium text-salex-white mb-salex-sm">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-salex-md text-salex-sm">
                <div>
                  <p className="text-salex-secondary">Code:</p>
                  <p className="text-salex-white font-salex-medium">{selectedTemplate.code}</p>
                </div>
                <div>
                  <p className="text-salex-secondary">Businesses Using:</p>
                  <p className="text-salex-white font-salex-medium">{selectedTemplate.businessCount}</p>
                </div>
                <div>
                  <p className="text-salex-secondary">Status:</p>
                  <Badge 
                    label={selectedTemplate.isActive ? 'Active' : 'Inactive'} 
                    variant={selectedTemplate.isActive ? 'success' : 'default'} 
                    size="sm" 
                  />
                </div>
                <div>
                  <p className="text-salex-secondary">Created:</p>
                  <p className="text-salex-white">{new Date(selectedTemplate.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-salex-lg font-salex-medium text-salex-white mb-salex-sm">
                Enabled Modules
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.enabledModules.map((module, index) => (
                  <Badge key={index} label={module} variant="info" size="sm" />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-salex-lg font-salex-medium text-salex-white mb-salex-sm">
                Terminology
              </h3>
              <div className="grid grid-cols-2 gap-salex-md text-salex-sm">
                <div>
                  <p className="text-salex-secondary">Resource:</p>
                  <p className="text-salex-white">{selectedTemplate.terminology.resource}</p>
                </div>
                <div>
                  <p className="text-salex-secondary">Staff:</p>
                  <p className="text-salex-white">{selectedTemplate.terminology.staff}</p>
                </div>
                <div>
                  <p className="text-salex-secondary">Service:</p>
                  <p className="text-salex-white">{selectedTemplate.terminology.service}</p>
                </div>
                <div>
                  <p className="text-salex-secondary">Appointment:</p>
                  <p className="text-salex-white">{selectedTemplate.terminology.appointment}</p>
                </div>
                <div>
                  <p className="text-salex-secondary">Customer:</p>
                  <p className="text-salex-white">{selectedTemplate.terminology.customer}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
