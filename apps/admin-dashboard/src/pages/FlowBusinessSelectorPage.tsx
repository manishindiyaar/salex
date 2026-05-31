import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@/components';
import { GitBranch, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface BusinessSummary {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  routingCode: string | null;
}

/**
 * FlowBusinessSelectorPage — shown at /flows.
 * Lists all businesses so the admin can select one to manage its flows.
 * This replaces the redirect-to-/businesses behavior so the Flows nav item works.
 */
export const FlowBusinessSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get('/api/v1/admin/businesses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBusinesses(res.data.data?.businesses || res.data.businesses || []);
      } catch {
        // Silently fail — empty list
      } finally {
        setIsLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p
          className="font-mono text-[10px] uppercase tracking-widest mb-1"
          style={{ color: '#A8A6B0' }}
        >
          Flows
        </p>
        <h1
          className="font-serif text-[28px] leading-tight"
          style={{ color: '#03031F', fontWeight: 400 }}
        >
          Conversation Flows
        </h1>
        <p className="text-[14px] mt-2" style={{ color: '#6F6D7A' }}>
          Select a business to manage its WhatsApp booking flows.
        </p>
      </div>

      {/* Business List */}
      <Card>
        <CardHeader
          title="Select Business"
          subtitle="Choose a business to view and manage its flows"
        />
        <CardBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" style={{ width: 24, height: 24 }} />
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[14px]" style={{ color: '#6F6D7A' }}>
                No businesses found. Create a business first.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {businesses.map((biz) => (
                <button
                  key={biz.id}
                  onClick={() => navigate(`/businesses/${biz.id}/flows`)}
                  className="w-full flex items-center justify-between p-4 rounded-salex-md border transition-colors hover:bg-[#F5F3F1] text-left"
                  style={{ borderColor: '#E5E4E3' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-salex-md flex items-center justify-center flex-shrink-0"
                      style={{ background: '#F5F3F1' }}
                    >
                      <GitBranch size={16} style={{ color: '#6F6D7A' }} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-semibold text-[14px] truncate"
                        style={{ color: '#03031F' }}
                      >
                        {biz.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="font-mono text-[11px]"
                          style={{ color: '#A8A6B0' }}
                        >
                          {biz.category}
                        </span>
                        {biz.routingCode && (
                          <span
                            className="font-mono text-[11px] px-1.5 py-0.5 rounded"
                            style={{ background: '#F5F3F1', color: '#6F6D7A' }}
                          >
                            {biz.routingCode}
                          </span>
                        )}
                        {!biz.isActive && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{ background: '#FEE2E2', color: '#C62020' }}
                          >
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: '#A8A6B0' }} />
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
